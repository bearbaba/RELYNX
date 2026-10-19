# RELYNX — Studionet evidence ledger

**Deployment observed in user-provided GenLayer Studio screenshot (2026-10-19):**

- Network: GenLayer Studionet (expected chain ID 61999; verify from live claim status).
- Deployed contract: `0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa`
- Studio import link: https://studio.genlayer.com/?import-contract=0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa
- Execution Mode: Normal (Full Consensus), displayed in Studio.
- Studio Transactions: **Deploy — FINALIZED** (green); full transaction hash still pending (only `0x4476…` is visible).
- The Studio's Read Methods panel displays **State: Accepted**; this is a separate label and does not undo the deploy FINALIZED transaction status.
- **Recorded:** issuer wallet, both `claim_status` readbacks, positive eligibility A/B, confirmed `parent_a = 1`, and source-committed, SHA-256-pinned notice for Claim #1.
- **Pending:** full-consensus `review_notice(1, commit, notice_sha256)` Studionet result, finalized TX and post-revocation eligibility readbacks. **No verified AI revocation or dependency cascade is claimed yet.**

## Initial eligibility readbacks — 2026-10-19

The user supplied two Studio **Call Contract → Response (Accepted)** view results:

| Method | Claim ID | Observed result |
| --- | ---: | --- |
| `can_rely(1)` | 1 | **`true`** |
| `can_rely(2)` | 2 | **`true`** |

These confirm both claims are presently eligible. Subsequent user-provided `claim_status(1)` and `claim_status(2)` readbacks verify the original issuer and **Claim #2's `parent_a = 1`**. The expected positive-to-negative transition after revocation remains untested.

## Claim #1 — live `claim_status(1)` readback (2026-10-19)

The user supplied the following result from GenLayer Studio `Call Contract → Response (Accepted)`, on the deployed instance. This is an observed read response, not an independently verified transaction receipt.

| Field | Observed value |
| --- | --- |
| `claim_id` | `1` |
| `chain_id` | `61999` |
| `issuer` | `0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb` |
| `repo` | `bearbaba/relynx` |
| `key` | `aurora-v1` |
| `statement` | `Issuer certifies library Aurora v1.0 as compliant with the published integration safety policy.` |
| `statement_sha256` | `cb26c28fd2056de111ee3970d20d3f50b244285d0a2b8ecf3c257c5bad436213` |
| `parent_a`, `parent_b` | `0`, `0` |
| `depth` | `1` |
| `state` | `ACTIVE` |
| `can_rely` | `true` |
| `last_decision`, `last_notice_sha256`, `revocation_url` | Empty strings |

**Baseline complete:** A is the root claim, and the subsequent `claim_status(2)` readback proves B depends directly on A.

## Claim #2 — live `claim_status(2)` readback (2026-10-19)

User-provided GenLayer Studio `Call Contract → Response (Accepted)`:

| Field | Observed value |
| --- | --- |
| `claim_id` | `2` |
| `chain_id` | `61999` |
| `issuer` | `0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb` |
| `repo` | `bearbaba/relynx` |
| `key` | `aurora-service` |
| `statement` | `Issuer declares Aurora integration service relies on the Aurora v1.0 safety certification.` |
| `statement_sha256` | `5f80c635b7f1d1fc30929d32d173345f996504fda28d26190390a6fa4e1f1cee` |
| `parent_a`, `parent_b` | **`1`**, `0` |
| `depth` | `2` |
| `state` | **`ACTIVE`** |
| `can_rely` | **`true`** |
| `last_decision`, `last_notice_sha256`, `revocation_url` | Empty strings |

This readback confirms the direct A → B dependency, which is necessary to demonstrate inheritance of revocation without modifying B.

## Commit-pinned Claim #1 revocation notice (prepared; not yet adjudicated)

- Source URL (immutable commit): https://raw.githubusercontent.com/bearbaba/relynx/bad26c15ab4a294142545ce2c48f78bbc0a923b5/notices/aurora-v1.txt
- Git commit SHA supplied to `review_notice`: `bad26c15ab4a294142545ce2c48f78bbc0a923b5`
- SHA-256 of exact UTF-8 notice document, **410 bytes without a trailing newline**: `1e6e5862f6fc0fd5a2a3861555eae09497a09f32785bf4711936408353e09388`
- Envelope: `RELYNX_NOTICE_V1`; `CHAIN_ID: 61999`, `CLAIM_ID: 1`, `KEY: aurora-v1`, `REPO: bearbaba/relynx`.
- Issuer in notice: `0x4c7cb73ac8f8999af21cfc9ff4cf2333a9508dcb` (lowercase of the registered wallet).
- `STATEMENT_SHA256`: `cb26c28fd2056de111ee3970d20d3f50b244285d0a2b8ecf3c257c5bad436213`.
- Notice statement (184 characters): `Effective immediately, the issuer explicitly revokes and withdraws the Aurora v1.0 integration safety certification for library Aurora v1.0 recorded in Claim #1; it is no longer valid.`
- GitHub content at the pinned commit was fetched again and compared to the prepared exact document.
- **Next live write, not yet observed:** `review_notice(1, "bad26c15ab4a294142545ce2c48f78bbc0a923b5", "1e6e5862f6fc0fd5a2a3861555eae09497a09f32785bf4711936408353e09388")`. Run in Normal (Full Consensus), wait for transaction finality and check **execution result**. The expected semantic verdict is `REVOKE` but is **not guaranteed** by merely preparing the file.

The intended acceptance gates are (i) A/B initially usable, (ii) issuer repo committed a version/claim-bound correction, (iii) GenLayer `REVOKE` resolution actually finalized, (iv) A and dependent B both no longer usable while B itself has not been rewritten, (v) invalid scope or non-revocation notice cannot revoke an unaffected C, (vi) source code/tests/CI green.

When live, attach exact full TX hashes and commit pinned notice URLs, state snapshots, and separate notes about Studio FINALIZED status versus execution result. Do not claim an independently verified Explorer receipt based only on a screenshot.
