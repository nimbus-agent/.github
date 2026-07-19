export const PUBLISH_PREDICATE = "https://github.com/npm/attestation/tree/main/specs/publish/v0.1";
export const SLSA_PREDICATE = "https://slsa.dev/provenance/v1";

/**
 * Decode the DSSE payloads out of a registry attestation response.
 *
 * The attestation content lives in `bundle.dsseEnvelope.payload` (base64 JSON),
 * NOT at the top level. We read predicateType from the decoded statement rather
 * than the unsigned outer wrapper.
 *
 * Returns null on any unrecognised shape — the caller maps that to
 * "indeterminate", never a false "ok".
 */
export function decodeStatements(body) {
  if (body === null || typeof body !== "object") return null;
  const list = body.attestations;
  if (!Array.isArray(list)) return null;
  const statements = [];
  for (const att of list) {
    const payload = att?.bundle?.dsseEnvelope?.payload;
    if (typeof payload !== "string") return null;
    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
    } catch {
      return null;
    }
    if (decoded === null || typeof decoded !== "object") return null;
    statements.push(decoded);
  }
  return statements;
}

function fail(status, detail) {
  return { status, detail };
}

/**
 * Assert the attestation set is complete AND attested to the expected source.
 * "An attestation exists" is a weaker claim than "attested to us".
 */
export function classifyProvenance(statements, expected) {
  if (statements === null) return fail("indeterminate", "unparseable attestation response");
  if (statements.length === 0) return fail("missing-provenance", "no attestations published");

  const types = new Set(statements.map((s) => s?.predicateType));
  if (!types.has(PUBLISH_PREDICATE)) {
    return fail("missing-provenance", "no npm publish attestation");
  }
  const slsa = statements.find((s) => s?.predicateType === SLSA_PREDICATE);
  if (slsa === undefined) {
    return fail("missing-provenance", "no SLSA provenance predicate — publish degraded");
  }

  const wf = slsa?.predicate?.buildDefinition?.externalParameters?.workflow;
  if (wf === null || typeof wf !== "object") {
    return fail("indeterminate", "provenance carries no workflow claim");
  }

  const wantRepo = `https://github.com/${expected.repo}`;
  if (wf.repository !== wantRepo) {
    return fail("source-mismatch", `repository ${String(wf.repository)} != ${wantRepo}`);
  }
  if (expected.workflow !== undefined && wf.path !== expected.workflow) {
    return fail("source-mismatch", `workflow ${String(wf.path)} != ${expected.workflow}`);
  }
  if (expected.sha !== undefined) {
    const deps = slsa?.predicate?.buildDefinition?.resolvedDependencies;
    const commit = Array.isArray(deps)
      ? deps.find((d) => typeof d?.digest?.gitCommit === "string")?.digest?.gitCommit
      : undefined;
    if (commit !== expected.sha) {
      return fail("source-mismatch", `commit ${String(commit)} != ${expected.sha}`);
    }
  }
  return { status: "ok", detail: `${String(wf.path)} @ ${String(wf.repository)}` };
}
