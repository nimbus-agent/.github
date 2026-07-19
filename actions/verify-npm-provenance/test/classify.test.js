import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { classifyProvenance, decodeStatements } from "../src/classify.js";

const real = JSON.parse(
  readFileSync(new URL("./fixtures/sdk-1.3.0.json", import.meta.url), "utf8"),
);
const EXPECTED = { repo: "nimbus-agent/nimbus-sdk", workflow: ".github/workflows/release.yml" };

function statementsOf(body) {
  const s = decodeStatements(body);
  assert.notEqual(s, null, "fixture should decode");
  return s;
}

test("real published package classifies ok", () => {
  const r = classifyProvenance(statementsOf(real), EXPECTED);
  assert.equal(r.status, "ok");
});

test("missing SLSA predicate is missing-provenance, not ok", () => {
  const only = {
    attestations: real.attestations.filter(
      (a) => a.predicateType === "https://github.com/npm/attestation/tree/main/specs/publish/v0.1",
    ),
  };
  const r = classifyProvenance(statementsOf(only), EXPECTED);
  assert.equal(r.status, "missing-provenance");
});

test("missing npm publish predicate is missing-provenance", () => {
  const only = {
    attestations: real.attestations.filter(
      (a) => a.predicateType === "https://slsa.dev/provenance/v1",
    ),
  };
  const r = classifyProvenance(statementsOf(only), EXPECTED);
  assert.equal(r.status, "missing-provenance");
});

test("wrong repo is source-mismatch", () => {
  const r = classifyProvenance(statementsOf(real), { repo: "attacker/evil" });
  assert.equal(r.status, "source-mismatch");
});

test("wrong workflow path is source-mismatch", () => {
  const r = classifyProvenance(statementsOf(real), {
    repo: "nimbus-agent/nimbus-sdk",
    workflow: ".github/workflows/attacker.yml",
  });
  assert.equal(r.status, "source-mismatch");
});

test("wrong commit sha is source-mismatch", () => {
  const r = classifyProvenance(statementsOf(real), {
    repo: "nimbus-agent/nimbus-sdk",
    sha: "0000000000000000000000000000000000000000",
  });
  assert.equal(r.status, "source-mismatch");
});

test("correct commit sha is ok", () => {
  const r = classifyProvenance(statementsOf(real), {
    repo: "nimbus-agent/nimbus-sdk",
    sha: "7e5a45f325d588a0b21eb5e1718a31c4ccb306cb",
  });
  assert.equal(r.status, "ok");
});

test("empty attestation list is missing-provenance", () => {
  const r = classifyProvenance(statementsOf({ attestations: [] }), EXPECTED);
  assert.equal(r.status, "missing-provenance");
});

test("null statements is indeterminate, never ok", () => {
  const r = classifyProvenance(null, EXPECTED);
  assert.equal(r.status, "indeterminate");
});

test("malformed body decodes to null", () => {
  assert.equal(decodeStatements(null), null);
  assert.equal(decodeStatements({}), null);
  assert.equal(decodeStatements({ attestations: "nope" }), null);
  assert.equal(decodeStatements({ attestations: [{ bundle: {} }] }), null);
});

test("truncated base64 payload decodes to null", () => {
  const broken = {
    attestations: [{ bundle: { dsseEnvelope: { payload: "bm90IGpzb24=" } } }],
  };
  assert.equal(decodeStatements(broken), null);
});

test("detail is a short summary, never the raw statement blob", () => {
  const r = classifyProvenance(statementsOf(real), EXPECTED);
  // Assert the actual content, not merely that it is short: a length bound
  // would pass on a truncated blob just as happily as on a real summary.
  assert.equal(
    r.detail,
    ".github/workflows/release.yml @ https://github.com/nimbus-agent/nimbus-sdk",
  );
  assert.ok(!/[A-Za-z0-9+/]{80,}={0,2}/.test(r.detail), "no base64 payload in detail");
  assert.ok(!r.detail.includes("dsseEnvelope"), "no envelope internals in detail");
});
