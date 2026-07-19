/**
 * Deterministic retry schedule: 5s doubling to a 30s cap, ~2.5 min total.
 *
 * Jitter is deliberately omitted. Jitter decorrelates a FLEET of clients
 * retrying in lockstep; here exactly one client retries per publish, so it
 * would only add nondeterminism to these tests. Do not re-add it.
 */
export const BACKOFF_MS = Object.freeze([5000, 10000, 20000, 30000, 30000, 30000, 30000]);

const REGISTRY = "https://registry.npmjs.org/-/npm/v1/attestations";

/**
 * All three encodings of a scoped name (raw, fully percent-encoded, mixed)
 * return HTTP 200 — verified against the live registry 2026-07-19. The raw
 * form is canonical here; no encoding is required.
 */
export function attestationUrl(pkg, version) {
  return `${REGISTRY}/${pkg}@${version}`;
}

/**
 * Attestations can trail a publish, and the registry is CDN-fronted, so a 404
 * is only conclusive once the backoff schedule is exhausted.
 *
 * Distinguishes "absent" (404 throughout — the package genuinely has no
 * attestation) from "error" (5xx / network / unparseable). Callers map those
 * to different severities.
 */
export async function fetchAttestations(pkg, version, deps) {
  const backoff = deps.backoff ?? BACKOFF_MS;
  const url = attestationUrl(pkg, version);
  let lastDetail = "no attempt made";

  for (let attempt = 0; attempt <= backoff.length; attempt += 1) {
    if (attempt > 0) await deps.sleep(backoff[attempt - 1]);
    try {
      const res = await deps.fetchFn(url, { headers: { accept: "application/json" } });
      if (res.status === 200) {
        try {
          return { outcome: "body", body: await res.json(), detail: "200" };
        } catch {
          // A 200 carrying unparseable bytes is transient, not authoritative:
          // a CDN/proxy error page or a truncated body both look like this.
          // Retry rather than failing a release on one bad edge response.
          lastDetail = "200 with unparseable JSON body";
          continue;
        }
      }
      if (res.status === 404) {
        lastDetail = "404 after full backoff";
        continue;
      }
      lastDetail = `HTTP ${res.status}`;
    } catch {
      // Never surface the thrown error object: fetch errors can embed request
      // headers, and this action runs in public logs.
      lastDetail = "network error";
    }
  }
  return lastDetail === "404 after full backoff"
    ? { outcome: "absent", detail: lastDetail }
    : { outcome: "error", detail: lastDetail };
}
