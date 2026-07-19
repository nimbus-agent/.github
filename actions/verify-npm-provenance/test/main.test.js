import assert from "node:assert/strict";
import { test } from "node:test";
import { decide, exitCodeFor } from "../src/main.js";

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
