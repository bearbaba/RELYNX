# RELYNX — Studionet evidence ledger

**Deployment observed in user-provided GenLayer Studio screenshot (2026-10-19):**

- Network: GenLayer Studionet (expected chain ID 61999; verify from live claim status).
- Deployed contract: `0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa`
- Studio import link: https://studio.genlayer.com/?import-contract=0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa
- Execution Mode: Normal (Full Consensus), displayed in Studio.
- Studio Transactions: **Deploy — FINALIZED** (green); full transaction hash still pending (only `0x4476…` is visible).
- The Studio's Read Methods panel displays **State: Accepted**; this is a separate label and does not undo the deploy FINALIZED transaction status.
- **Pending:** exact issuer wallet, `claim_status(1)`, `claim_status(2)` to verify the parent graph and chain ID, source-committed notice and full-consensus `review_notice()` receipt. There is **no verified AI decision or dependency cascade yet**.

## Initial eligibility readbacks — 2026-10-19

The user supplied two Studio **Call Contract → Response (Accepted)** view results:

| Method | Claim ID | Observed result |
| --- | ---: | --- |
| `can_rely(1)` | 1 | **`true`** |
| `can_rely(2)` | 2 | **`true`** |

These confirm both claims are presently eligible. They do **not yet independently confirm** Claim #2 has `parent_a = 1`, or establish the issuer address. Both must be checked with `claim_status` before building a scope-bound revocation notice. The expected positive-to-negative transition after revocation remains untested.

The intended acceptance gates are (i) A/B initially usable, (ii) issuer repo committed a version/claim-bound correction, (iii) GenLayer `REVOKE` resolution actually finalized, (iv) A and dependent B both no longer usable while B itself has not been rewritten, (v) invalid scope or non-revocation notice cannot revoke an unaffected C, (vi) source code/tests/CI green.

When live, attach exact full TX hashes and commit pinned notice URLs, state snapshots, and separate notes about Studio FINALIZED status versus execution result. Do not claim an independently verified Explorer receipt based only on a screenshot.
