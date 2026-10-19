# RELYNX V1 — Security policy and adversarial threat model

## Authority boundaries

- Any wallet may register an attestation **under its own issuer address** and choose its preferred GitHub source repository. The contract does not authenticate that the wallet controls the repo. There is no global allowlist or grant of independent reputation.
- Any caller may request verification of a correction from a repository the issuer **already recorded on-chain**; arbitrary third-party URLs cannot change the source policy.
- Only a verified, explicit issuer correction may mark a claim `REVOKED`. No one can directly call a public `set_revoked()` or edit another claim's issuer/parents/statement.
- `can_rely` is strictly claim-scoped, assumes clients have separately selected trusted issuers, and is valid only at current observed chain state.

## Boundedness and invariants

- Parent IDs are strictly lower than the created claim ID. Parents are not editable, prohibiting cycles and replayed graph transitions. Max depth 4, fan-in 2, max traversal 15 nodes.
- Each notice URL is deterministic: HTTPS raw GitHub + registered canonical owner/repo + Git commit SHA40 + `notices/<key>.txt`. No domains, branch names, arbitrary file paths, fragments, query arguments, ports or embedded credentials may be supplied by a challenger.
- The notice must match chain, claim, issuer, repository, key and *original statement digest*. Git `commit` and notice SHA-256 are immutable transaction inputs; source failures never authorize revocation.
- A one-time `REVOKE` is terminal and cannot be replaced by a later, contradic­ting notice (the data source may be corrected, but the original claim must be registered anew under a new ID).
- The raw natural-language notice is explicitly treated as untrusted prompt **data**, and model-proposed quotes are checked as exact substrings. This mitigates but cannot eliminate misleading data or prompt injection.
- Duplicate same full-notice hash cannot be reviewed on the same active claim once a valid semantic decision has been stored.

## Threats not solved by the V1 contract

| Threat | Limitation |
| --- | --- |
| Fake issuer and arbitrary self-certification | Registration identifies an issuer *wallet*, not whether the issuer is reputable. Consumers must check issuer and subject before relying. |
| GitHub repository control mismatch | Registry records the wallet's own assertion of repo identity; no cryptographic wallet-to-repo ownership proof. |
| Historic withdrawal reused after correction | Full commit pin guarantees immutability, **not freshness or monotonic publication chronology**. A valid older withdrawal may still be submitted. Reissue a new claim if a withdrawn claim is restored. |
| Compromised source repository | Source policy binds to repo identity but cannot defend against its legitimate or compromised writers. |
| Natural-language or validator error | Validator semantic decisions may be wrong. Require precise quote support and comparative consensus; no formal proof of meaning. |
| Ambiguous notice or source failure | Preserves prior attestation and never makes a new revocation; external consumers may impose stricter timeout policies. |
| Spam registrations / challenges | Any caller may issue self-claims or pay to challenge; no protocol-level staking or fee beyond transaction execution cost. No challenger can freeze claims by starting an unfinished dispute. |
| Fake independent execution proof | The issuer statement and its GitHub notice are not third-party attestations of compliance or security. |

## Test coverage and evidence standard

`tests/test_local.py` includes graph-cycle/depth guard, positive revocation, dependent loss of reliance, source mismatch and retry, issuer repo pinning, wrong chain/identity/statement hashes, unsupported quotes, and non-revocation semantics. The SDK DirectVM suite tests actual GenVM storage, signer and graph behavior without pretending to prove live validator consensus. Submit only finalized live Studionet transaction hashes and observed readbacks after they exist; a passing CI build is not enough evidence of deployed AI results.
