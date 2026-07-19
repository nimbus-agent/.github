import assert from "node:assert/strict";
import { test } from "node:test";
import { attestationUrl, BACKOFF_MS, fetchAttestations } from "../src/fetch-attestations.js";

const noSleep = async () => {};

test("url uses the raw scoped name (all forms verified 200; raw is canonical)", () => {
  assert.equal(
    attestationUrl("@nimbus-dev/sdk", "1.3.0"),
    "https://registry.npmjs.org/-/npm/v1/attestations/@nimbus-dev/sdk@1.3.0",
  );
});

test("backoff is deterministic, ~2.5 min, capped at 30s (no jitter)", () => {
  assert.deepEqual([...BACKOFF_MS], [5000, 10000, 20000, 30000, 30000, 30000, 30000]);
  const total = BACKOFF_MS.reduce((a, b) => a + b, 0);
  assert.equal(total, 155000);
  assert.ok(Math.max(...BACKOFF_MS) === 30000);
});

test("200 on first attempt returns body without sleeping", async () => {
  let slept = 0;
  const r = await fetchAttestations("@x/y", "1.0.0", {
    fetchFn: async () => new Response(JSON.stringify({ attestations: [] }), { status: 200 }),
    sleep: async () => {
      slept += 1;
    },
  });
  assert.equal(r.outcome, "body");
  assert.deepEqual(r.body, { attestations: [] });
  assert.equal(slept, 0);
});

test("404 retries the full schedule then reports absent", async () => {
  let calls = 0;
  const slept = [];
  const r = await fetchAttestations("@x/y", "1.0.0", {
    fetchFn: async () => {
      calls += 1;
      return new Response("", { status: 404 });
    },
    sleep: async (ms) => {
      slept.push(ms);
    },
  });
  assert.equal(r.outcome, "absent");
  assert.equal(calls, BACKOFF_MS.length + 1, "initial attempt plus one per backoff step");
  assert.deepEqual(slept, [...BACKOFF_MS]);
});

test("404 then 200 succeeds without exhausting the schedule", async () => {
  let calls = 0;
  const r = await fetchAttestations("@x/y", "1.0.0", {
    fetchFn: async () => {
      calls += 1;
      return calls < 3
        ? new Response("", { status: 404 })
        : new Response(JSON.stringify({ attestations: [1] }), { status: 200 });
    },
    sleep: noSleep,
  });
  assert.equal(r.outcome, "body");
  assert.equal(calls, 3);
});

test("5xx exhausts retries and reports error, not absent", async () => {
  let calls = 0;
  const r = await fetchAttestations("@x/y", "1.0.0", {
    fetchFn: async () => {
      calls += 1;
      return new Response("", { status: 503 });
    },
    sleep: noSleep,
  });
  assert.equal(r.outcome, "error");
  assert.match(r.detail, /503/);
  assert.equal(
    calls,
    BACKOFF_MS.length + 1,
    "5xx is retryable; must exhaust the full schedule before reporting error",
  );
});

test("network throw is error, never absent", async () => {
  let calls = 0;
  const r = await fetchAttestations("@x/y", "1.0.0", {
    fetchFn: async () => {
      calls += 1;
      throw new Error("ECONNRESET");
    },
    sleep: noSleep,
  });
  assert.equal(r.outcome, "error");
  assert.equal(
    calls,
    BACKOFF_MS.length + 1,
    "network errors are transient; must exhaust the full schedule before reporting error",
  );
});

test("invalid JSON body retries, then reports error — never a false absent", async () => {
  let calls = 0;
  const r = await fetchAttestations("@x/y", "1.0.0", {
    fetchFn: async () => {
      calls += 1;
      return new Response("<html>502</html>", { status: 200 });
    },
    sleep: noSleep,
  });
  assert.equal(r.outcome, "error");
  assert.equal(calls, BACKOFF_MS.length + 1, "a proxy error page is transient — must retry");
});

test("transient bad body then good body succeeds", async () => {
  let calls = 0;
  const r = await fetchAttestations("@x/y", "1.0.0", {
    fetchFn: async () => {
      calls += 1;
      return calls === 1
        ? new Response("<html>502</html>", { status: 200 })
        : new Response(JSON.stringify({ attestations: [1] }), { status: 200 });
    },
    sleep: noSleep,
  });
  assert.equal(r.outcome, "body");
  assert.equal(calls, 2);
});
