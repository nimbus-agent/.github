import assert from "node:assert/strict";
import { test } from "node:test";
import { decide, exitCodeFor, renderOutputs } from "../src/main.js";

test("absent attestation is missing-provenance", () => {
  const r = decide({ outcome: "absent", detail: "404 after full backoff" }, { repo: "a/b" });
  assert.equal(r.status, "missing-provenance");
});

test("registry error is indeterminate, not a false failure claim", () => {
  const r = decide({ outcome: "error", detail: "HTTP 503" }, { repo: "a/b" });
  assert.equal(r.status, "indeterminate");
});

test("gate severity fails on anything other than ok", () => {
  assert.equal(exitCodeFor("ok", "gate"), 0);
  assert.equal(exitCodeFor("missing-provenance", "gate"), 1);
  assert.equal(exitCodeFor("source-mismatch", "gate"), 1);
  assert.equal(exitCodeFor("indeterminate", "gate"), 1);
});

test("monitor severity never fails the job — the caller classifies", () => {
  assert.equal(exitCodeFor("ok", "monitor"), 0);
  assert.equal(exitCodeFor("missing-provenance", "monitor"), 0);
  assert.equal(exitCodeFor("indeterminate", "monitor"), 0);
});

test("same input yields different severity, same status", () => {
  const input = { outcome: "error", detail: "HTTP 503" };
  const status = decide(input, { repo: "a/b" }).status;
  assert.equal(exitCodeFor(status, "gate"), 1);
  assert.equal(exitCodeFor(status, "monitor"), 0);
});

// `detail` is built from registry-supplied data, so it is attacker-influenced
// in the only threat model that matters here. With the old `key=value` form a
// newline in it emitted a second `status=` line, and GitHub takes the LAST
// occurrence of a duplicate key — turning a source-mismatch into a reported ok.
/**
 * Parse a $GITHUB_OUTPUT file the way the runner does: a `key<<DELIM` line
 * opens a block that ends at a line exactly equal to DELIM, and everything in
 * between is literal data; otherwise `key=value`. Later keys win, which is the
 * property the old format let an attacker exploit.
 */
function parseOutputs(rendered) {
  const parsed = new Map();
  const lines = rendered.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const heredoc = /^([A-Za-z_][\w-]*)<<(\S+)$/.exec(lines[i]);
    if (heredoc) {
      const [, key, delim] = heredoc;
      const body = [];
      i++;
      while (i < lines.length && lines[i] !== delim) body.push(lines[i++]);
      parsed.set(key, body.join("\n"));
      continue;
    }
    const kv = /^([A-Za-z_][\w-]*)=(.*)$/.exec(lines[i]);
    if (kv) parsed.set(kv[1], kv[2]);
  }
  return parsed;
}

test("a newline in detail cannot forge a second status assignment", () => {
  const injected = "repository evil/repo != a/b\nstatus=ok";
  const parsed = parseOutputs(
    renderOutputs([
      ["status", "source-mismatch"],
      ["detail", injected],
    ]),
  );
  // The whole point: the payload is data, so the real verdict survives.
  assert.equal(parsed.get("status"), "source-mismatch");
  assert.equal(parsed.get("detail"), injected);
});

test("a value cannot close its own heredoc block", () => {
  // Even if the payload guesses the delimiter *shape*, the random suffix means
  // the emitted closing line is not one the value can reproduce.
  const rendered = renderOutputs([["detail", "x\nghadelim_deadbeef\ny"]], () => "ghadelim_stable");
  const closers = rendered.split("\n").filter((line) => line === "ghadelim_stable");
  assert.equal(closers.length, 1);
});

test("ordinary values round-trip through the heredoc form", () => {
  const rendered = renderOutputs([
    ["status", "ok"],
    ["detail", "verified"],
  ]);
  assert.match(rendered, /^status<<(\S+)\nok\n\1\ndetail<<(\S+)\nverified\n\2\n$/);
});
