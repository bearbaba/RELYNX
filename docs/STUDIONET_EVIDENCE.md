# RELYNX — Studionet evidence ledger

**Deployment observed in user-provided GenLayer Studio screenshot (2026-10-19):**

- Network: GenLayer Studionet (expected chain ID 61999; verify from live claim status).
- Deployed contract: `0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa`
- Studio import link: https://studio.genlayer.com/?import-contract=0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa
- Execution Mode: Normal (Full Consensus), displayed in Studio.
- Studio Transactions: **Deploy — FINALIZED** (green); full transaction hash still pending (only `0x4476…` is visible).
- The Studio's Read Methods panel displays **State: Accepted**; this is a separate label and does not undo the deploy FINALIZED transaction status.
- **Recorded:** issuer wallet, both `claim_status` readbacks, positive eligibility A/B, confirmed `parent_a = 1`, and source-committed, SHA-256-pinned notice for Claim #1.
- **Observed from user-provided `claim_status` readbacks:** Claim #1 now `REVOKED` with `last_decision = REVOKE`, and Claim #2 stays `ACTIVE` but inherits `can_rely = false` via `parent_a = 1`. Both had `can_rely = true` before review.
- **Still pending:** the full `review_notice(1)` TX hash / detailed consensus receipt, validation of its `FINALIZED` and execution-result statuses, and an optional direct Studio copy of `revocation_url` (the user message presented it with Markdown link markup). No independent Explorer receipt has been checked.

## Initial eligibility readbacks — 2026-10-19

The user supplied two Studio **Call Contract → Response (Accepted)** view results:

| Method | Claim ID | Observed result |
| --- | ---: | --- |
| `can_rely(1)` | 1 | **`true`** |
| `can_rely(2)` | 2 | **`true`** |

These readbacks establish the **pre-revocation** baseline. Later user-provided `claim_status(1)` and `claim_status(2)` readbacks verify Claim #2 has `parent_a = 1` and that revocation of A is now reflected in B's **derived `can_rely`**, while B's stored state remains `ACTIVE`.

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

## Commit-pinned Claim #1 revocation notice (reviewed on Studionet; TX receipt pending)

- Source URL (immutable commit): https://raw.githubusercontent.com/bearbaba/relynx/bad26c15ab4a294142545ce2c48f78bbc0a923b5/notices/aurora-v1.txt
- Git commit SHA supplied to `review_notice`: `bad26c15ab4a294142545ce2c48f78bbc0a923b5`
- SHA-256 of exact UTF-8 notice document, **410 bytes without a trailing newline**: `1e6e5862f6fc0fd5a2a3861555eae09497a09f32785bf4711936408353e09388`
- Envelope: `RELYNX_NOTICE_V1`; `CHAIN_ID: 61999`, `CLAIM_ID: 1`, `KEY: aurora-v1`, `REPO: bearbaba/relynx`.
- Issuer in notice: `0x4c7cb73ac8f8999af21cfc9ff4cf2333a9508dcb` (lowercase of the registered wallet).
- `STATEMENT_SHA256`: `cb26c28fd2056de111ee3970d20d3f50b244285d0a2b8ecf3c257c5bad436213`.
- Notice statement (184 characters): `Effective immediately, the issuer explicitly revokes and withdraws the Aurora v1.0 integration safety certification for library Aurora v1.0 recorded in Claim #1; it is no longer valid.`
- GitHub content at the pinned commit was fetched again and compared to the prepared exact document.
- **Actual on-chain state observed subsequently:** `claim_status(1).last_decision = REVOKE`, `state = REVOKED`, with exact `last_notice_sha256 = revocation_sha256` equal to the pinned notice digest above. The user has not yet supplied the `review_notice` transaction hash, finality screenshot or detailed validator receipt; therefore do not label that specific transaction `FINALIZED` based only on a view readback.

## Post-revocation verification — user-provided live view readbacks (2026-10-19)

The user provided GenLayer Studio `Call Contract → Response (Accepted)` values for `claim_status(1)` and `claim_status(2)` following the notice review. These are **observed contract view results**, not an independently inspected GenLayer transaction receipt.

| Field | Claim #1 (source) | Claim #2 (dependent) |
| --- | --- | --- |
| `claim_id` | `1` | `2` |
| `state` | **`REVOKED`** | **`ACTIVE`** |
| `can_rely` before | `true` | `true` |
| `can_rely` after | **`false`** | **`false`** |
| `parent_a` / `parent_b` | `0` / `0` | **`1`** / `0` |
| `last_decision` | **`REVOKE`** | Empty string |
| `last_notice_sha256` | `1e6e5862f6fc0fd5a2a3861555eae09497a09f32785bf4711936408353e09388` | Empty string |
| `revocation_sha256` | `1e6e5862f6fc0fd5a2a3861555eae09497a09f32785bf4711936408353e09388` | Empty string |
| `last_quote_sha256` | `b6c138c20ce969efdd7d25ba6ce817023721e79fedfef3d8dbc9f74f4c86ee0f` | Empty string |
| `statement_sha256` | `cb26c28fd2056de111ee3970d20d3f50b244285d0a2b8ecf3c257c5bad436213` | `5f80c635b7f1d1fc30929d32d173345f996504fda28d26190390a6fa4e1f1cee` |

Both records report `chain_id = 61999` and `issuer = 0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb`. The registered repository remains `bearbaba/relynx` and the keys are `aurora-v1` and `aurora-service`, respectively.

**Demonstrated dependency consequence:** claim #2's *stored* `state` remains `ACTIVE`, with no new notice/decision fields, while its **derived** `can_rely` is now `false`, inherited from revoked parent Claim #1. This confirms the core two-claim cascade behavior through on-chain views without requiring a separate child-revocation write.

**Source display caution:** the user message showed `revocation_url` formatted as a Markdown link; verify the raw Studio value when documenting exact URL bytes. The expected commit-pinned URL from contract code is https://raw.githubusercontent.com/bearbaba/relynx/bad26c15ab4a294142545ce2c48f78bbc0a923b5/notices/aurora-v1.txt.

**Remaining evidence gate:** obtain the **full transaction hash** of the actual `review_notice(1)` call, check that it is `FINALIZED` with successful execution, and attach its validator decision/consensus history. A separate negative `KEEP` or `INVALID_SCOPE` case (optional for a stronger reviewer package) is not yet demonstrated live.

The intended acceptance gates are (i) A/B initially usable, (ii) issuer repo committed a version/claim-bound correction, (iii) GenLayer `REVOKE` resolution actually finalized, (iv) A and dependent B both no longer usable while B itself has not been rewritten, (v) invalid scope or non-revocation notice cannot revoke an unaffected C, (vi) source code/tests/CI green.

When live, attach exact full TX hashes and commit pinned notice URLs, state snapshots, and separate notes about Studio FINALIZED status versus execution result. Do not claim an independently verified Explorer receipt based only on a screenshot.
