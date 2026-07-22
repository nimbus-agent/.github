import { randomUUID } from "node:crypto";
import { appendFileSync } from "node:fs";
import { classifyProvenance, decodeStatements } from "./classify.js";
import { fetchAttestations } from "./fetch-attestations.js";

/**
 * Render workflow outputs using the heredoc-delimiter form.
 *
 * `detail` is not a fixed vocabulary — it is built from registry-supplied data
 * (the DSSE `repository` field, for one). With the plain `key=value` form a
 * newline in that value emits a second `status=` line, and GitHub resolves
 * duplicate keys last-wins, so a `source-mismatch` could be read downstream as
 * `ok`. A random per-call delimiter means a value can never close its own block
 * and so can never start a line the runner would parse as a key assignment.
 */
export function renderOutputs(entries, newDelimiter = defaultDelimiter) {
  let block = "";
  for (const [key, value] of entries) {
    const delim = newDelimiter();
    block += `${key}<<${delim}\n${String(value)}\n${delim}\n`;
  }
  return block;
}

function defaultDelimiter() {
  return `ghadelim_${randomUUID().replaceAll("-", "")}`;
}

/** Map a fetch outcome plus the classifier into a single status. */
export function decide(fetched, expected) {
  if (fetched.outcome === "absent") {
    return { status: "missing-provenance", detail: fetched.detail };
  }
  if (fetched.outcome === "error") {
    // A registry problem is NOT evidence the publish was bad.
    return { status: "indeterminate", detail: fetched.detail };
  }
  return classifyProvenance(decodeStatements(fetched.body), expected);
}

/**
 * The gate must not let a possibly-degraded publish through; the monitor must
 * not turn a registry hiccup into issue spam. Same status, different severity.
 */
export function exitCodeFor(status, severity) {
  if (severity === "monitor") return 0;
  return status === "ok" ? 0 : 1;
}

function runbook(pkg, version, status, detail) {
  return [
    "::error::npm provenance verification FAILED",
    `::error::package=${pkg}@${version} status=${status} detail=${detail}`,
    "::error::RUNBOOK:",
    "::error::  1. This version is already on the registry. npm allows unpublish",
    "::error::     only within 72h of publish — check the publish timestamp now.",
    "::error::  2. Within 72h: `npm unpublish <pkg>@<version>`, fix the cause, republish.",
    '::error::  3. After 72h: `npm deprecate <pkg>@<version> "no provenance; use <next>"`',
    "::error::     then publish a patch version with provenance.",
    "::error::  4. Common causes: `id-token: write` missing from the publish job;",
    "::error::     npm older than 11.5.1; trusted-publisher binding removed on npmjs.com.",
  ].join("\n");
}

if (process.env["NODE_ENV"] !== "test" && process.argv[1]?.endsWith("main.js")) {
  const pkg = process.env["INPUT_PACKAGE"] ?? "";
  const version = process.env["INPUT_VERSION"] ?? "";
  const severity = process.env["INPUT_SEVERITY"] === "monitor" ? "monitor" : "gate";
  const expected = { repo: process.env["INPUT_EXPECTED_REPO"] ?? "" };
  const wf = process.env["INPUT_EXPECTED_WORKFLOW"];
  const sha = process.env["INPUT_EXPECTED_SHA"];
  if (wf) expected.workflow = wf;
  if (sha) expected.sha = sha;

  const fetched = await fetchAttestations(pkg, version, {
    fetchFn: fetch,
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
  });
  const { status, detail } = decide(fetched, expected);

  const out = process.env["GITHUB_OUTPUT"];
  if (out) {
    appendFileSync(
      out,
      renderOutputs([
        ["status", status],
        ["detail", detail],
      ]),
    );
  }
  console.log(`npm provenance: ${pkg}@${version} -> ${status} (${detail})`);
  if (status !== "ok" && severity === "gate") console.log(runbook(pkg, version, status, detail));
  // Set exitCode instead of calling process.exit(): exit() tears the process
  // down immediately, which can race undici's keep-alive sockets/timers
  // (observed as a libuv UV_HANDLE_CLOSING assertion crash on Windows/Node 24)
  // and can truncate buffered stdout / the GITHUB_OUTPUT write. Assigning
  // process.exitCode lets Node exit naturally once the event loop drains,
  // preserving the same exit-code contract without the early teardown.
  process.exitCode = exitCodeFor(status, severity);
}
