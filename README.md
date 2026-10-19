# RELYNX

**When evidence changes, trust must change with it.**

**RELYNX is a standalone GenLayer Intelligent Contract for revoking issuer-controlled attestations and automatically invalidating dependent trust.** It is a reusable primitive, not an app or a token product.

A registered issuer wallet asserts a claim and chooses its public GitHub notice repository. Any reviewer may present an immutable, commit-pinned notice **from that pre-registered repository**. Independent GenLayer validators fetch and hash the notice and comparatively reason about whether it *explicitly withdraws that exact claim*. If they agree on `REVOKE`, the claim becomes irrevocably `REVOKED`. Any dependent claim instantly fails `can_rely()` without rewriting dependent storage.

## Why GenLayer matters

The hard question is semantic: *does an official natural-language correction cancel this particular certification, or does it concern another version, time window, or scope?* A deterministic hash and Git commit verify which notice was examined, but cannot decide its meaning. RELYNX uses `gl.eq_principle.prompt_comparative` with source-level quotation constraints and three non-transport decisions: `REVOKE`, `KEEP`, `UNVERIFIABLE`.

## On-chain API

| Function | Access | Consequence |
| --- | --- | --- |
| `register_claim(repo_owner, repo_name, key, statement, parent_a, parent_b)` | Any issuer wallet | Registers a **wallet-issued** attestation and its immutable source policy; a parent ID of `0` means none |
| `review_notice(claim_id, commit, notice_sha256)` | Anyone | Checks a real issuer-repository notice; on proof of effective withdrawal, sets the original claim `REVOKED` |
| `can_rely(claim_id)` | View | `true` only if the claim **and every ancestor** remain `ACTIVE` |
| `claim_status(claim_id)` | View | Shows issuer, registered repository, original statement/digest, parents, decision, revocation proof and effective eligibility |
| `claim_count()` | View | Number of registered attestations |

No funds, deposits, global reputation or automatic third-party penalties. A downstream consumer MUST inspect issuer identity and claim scope in addition to `can_rely()`.

## Invariants

- **Monotonic DAG:** parent IDs must precede the child; depth at most four. Two parents per claim, at most 15 graph visits per view. No cyclic or unbounded propagation.
- **Deterministic issuer-source policy:** review URL is constructed in contract code as `https://raw.githubusercontent.com/<registered-owner>/<registered-repo>/<40-hex-commit>/notices/<registered-key>.txt`; no caller-supplied URL, path, domain, query, or branch.
- **Scope-bound notice:** exact chain ID, claim ID, issuer wallet, repository, claim key and on-chain statement SHA-256 must match the document header. Full document SHA-256 is committed in the invocation.
- **Fail-closed revocation:** only an unambiguous `REVOKE`, supported by an exact quotation from a hash-matching notice, can revoke a claim. `KEEP` and `UNVERIFIABLE` do not revoke. Fetch/hash/scope errors are diagnostics and do not mutate the record.
- **Live dependency invalidation:** revoking A makes `can_rely(B)` false whenever B has A as an ancestor, even though B's own registered state remains `ACTIVE`.
- **Irreversible revocation:** V1 cannot reinstate a revoked claim. An issuer may register a new independently identified replacement attestation when warranted.

## Limits and trust boundaries

**A wallet registrant *asserts* ownership/control of its chosen GitHub repository; RELYNX does not cryptographically prove that wallet-to-GitHub relationship.** Consumers must recognize trusted issuers themselves. A repository compromise, a misleading historic notice, or false off-chain statements remain real risks. A source digest proves integrity, not truth or publisher legitimacy beyond the chosen policy. V1 does not attest to time-order/freshness of GitHub notices and has no third-party agent signatures. See [Security](docs/SECURITY.md).

`UNVERIFIABLE` preserves the previously issued attestation rather than silently granting revocation power to arbitrary challengers. It does **not** certify that the claim remains truthful. Clients needing stricter safety should apply their own additional checks.

## Repository

- [Intelligent Contract](contracts/relynx.py) — GenLayer V1 implementation.
- [Architecture and equivalence checks](docs/ARCHITECTURE.md) — source boundary, dependency DAG, state machine.
- [Security and threat model](docs/SECURITY.md) — assumptions, authorization and residual risks.
- [Studionet demo protocol](docs/DEMO.md) — exact write/read sequence and evidence collection without invented results.
- [Local deterministic unit tests](tests/test_local.py) — dependency, source, adverse prompts, rollback and claims.
- [Official GenVM DirectVM tests](tests/test_direct_genvm.py) — actual GenVM persistent storage and caller behavior.
- [Notice preparation](scripts/prepare_notice.py) — build exact bytes and SHA-256 with the correct chain, claim ID and issuer.
- [GitHub Actions](.github/workflows/ci.yml) — Python tests, GenVM linter and DirectVM.

**Studionet deployment (2026-10-19):** [RELYNX instance](https://studio.genlayer.com/?import-contract=0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa) at `0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa`. The user-provided GenLayer Studio screenshot shows the **Deploy transaction FINALIZED**; its complete TX hash has not yet been supplied. Claim registration, issuer notice, GenLayer comparative-consensus review and dependency invalidation remain to be demonstrated. Do not confuse deployment with functional consensus verification. This is an experimental testnet primitive, not a security audit.

License: MIT.
