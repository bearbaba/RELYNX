# RELYNX — One-contract Studionet demonstration

**Status: core A → B revocation demonstrated by user-provided Studionet view readbacks (2026-10-19).** The full `review_notice` hash and Studio FINALIZED status are recorded; Explorer transaction details now confirm Execution SUCCESS, Consensus Accepted and return REVOKE; complete per-validator outputs remain to be captured; the issuer claim is synthetic, not a genuine outside-party certification.

## Contract

- Source: `contracts/relynx.py`, class `Relynx`.
- Studionet chain ID: `61999`.
- Parameterless constructor.
- No web UI required.
- **Deployed RELYNX instance (user Studio screenshot, 2026-10-19):** https://studio.genlayer.com/?import-contract=0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa (`0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa`); Deploy transaction displayed FINALIZED. Live claims 1/2 and the inherited revocation consequence are visible by readbacks; all four complete write TX hashes are recorded in [STUDIONET_EVIDENCE.md](STUDIONET_EVIDENCE.md).
- The issuer has registered **actual claim IDs 1 and 2**; the original baseline and post-revocation readbacks are recorded in [STUDIONET_EVIDENCE.md](STUDIONET_EVIDENCE.md). Do not re-register these demo claims.

## Minimal write/read path

1. Deploy `Relynx` to GenLayer Studionet in **Normal (Full Consensus)** mode for AI actions. Record the Explorer `FINALIZED` contract TX.
2. Call `register_claim("bearbaba", "relynx", "aurora-v1", "Issuer certifies library Aurora v1.0 as compliant with the published integration safety policy.", 0, 0)` from the chosen issuer wallet; record its returned claim ID **A** (probably 1 in a fresh contract).
3. Call `register_claim("bearbaba", "relynx", "aurora-service", "Issuer declares Aurora integration service relies on the Aurora v1.0 safety certification.", A, 0)`; record returned child ID **B**. (These statements are illustrative, *not external verified certifications*.)
4. Read `can_rely(A)` and `can_rely(B)` — both should be `true`. Check `claim_status(B)` shows dependency on A and `state=ACTIVE`.
5. Prepare an **issuer-published** notice whose exact header includes chain ID, claim ID, issuer address, registered repo, key and the immutable on-chain statement digest. Its body should explicitly and unambiguously revoke *Aurora v1.0*; the sentence must be 24–240 characters and clearly match the original. The helper below creates the correct bytes and hashes.
6. Commit the notice to `notices/aurora-v1.txt` in **this registered repository**. Copy the resulting **full 40-character lowercase Git commit SHA**. Because source policy pins the path, do not change the file after computing its hash unless you also use the new commit and digest.
7. From any wallet call `review_notice(A, git_commit_sha, notice_sha256)` under **Normal (Full Consensus)**. Inspect the actual result rather than assuming success. A correct `REVOKE` result changes A's `state` to `REVOKED`, with a stored revocation source URL and digest.
8. Read `can_rely(A)=false` and `can_rely(B)=false`, **without submitting a transaction to update B**. Check `claim_status(B).state` remains `ACTIVE` but its derived `can_rely` field is `false`.
9. Negative case: register an independent claim **C**, then submit a well-formed repo notice for the wrong chain or claim ID with a correct full document digest. `review_notice(C, commit, digest)` should return `INVALID_SCOPE`, leaving C active. Alternatively use a different version-only notice to demonstrate `KEEP`, or a temporary invalid digest for `SOURCE_MISMATCH`.
10. Record exact 40/64-char commit/content hashes, GenLayer Explorer TX links, `case/claim_status` readbacks and screenshot/error details in `docs/STUDIONET_EVIDENCE.md` **after observing them**.

## Prepared live notice for the confirmed A → B instance (2026-10-19)

**A and B readbacks confirmed:** A (ID 1) is `ACTIVE`, and B (ID 2) is `ACTIVE` with `parent_a=1`; both `can_rely` views returned `true`. The A issuer is `0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb`, on Studionet chain `61999`.

A deterministic notice was created at `notices/aurora-v1.txt`, committed and fetched back without content differences. **Do not prepare or modify another notice for this demo.**

- Exact source URL: https://raw.githubusercontent.com/bearbaba/relynx/bad26c15ab4a294142545ce2c48f78bbc0a923b5/notices/aurora-v1.txt
- `review_notice` inputs: `claim_id = 1`, `commit = "bad26c15ab4a294142545ce2c48f78bbc0a923b5"`, `notice_sha256 = "1e6e5862f6fc0fd5a2a3861555eae09497a09f32785bf4711936408353e09388"`.
- **Observed in subsequent `claim_status` readbacks:** Claim #1 is `REVOKED` with `last_decision = REVOKE` and matching full notice SHA-256; Claim #2 remains `ACTIVE` but its derived `can_rely` has switched `true → false`. This confirms the read-side dependency consequence.
- **Observed:** complete `review_notice(1)` [TX hash](https://explorer-studio.genlayer.com/tx/0xe4d5c3ea361293152e406326b029ed41234251bdf6c108e8dfa9cd37f0f57624), marked **FINALIZED** in the user's Studio transaction list. The user-provided Explorer transaction details show Execution SUCCESS, Consensus Accepted and return REVOKE. Individual validator outputs remain incomplete in the supplied excerpt.

## Additional live negative-case test — KEEP for Claim #3 (pending)

A third independent claim has been registered and confirmed by Studio readback: `claim_id=3`, `key=aurora-v2`, `state=ACTIVE`, `can_rely=true`, with no parents. This claim asserts an illustrative Aurora v2.0 certification and is independent of the revoked Aurora v1.0 source claim.

The exact issuer-source notice is pinned at:
https://raw.githubusercontent.com/bearbaba/relynx/1cbd8ccbd5d5a7163c33d6864adf3196e38d9968/notices/aurora-v2.txt

Call `review_notice` in Studio Normal (Full Consensus) with:
- `claim_id = 3`
- `commit = 1cbd8ccbd5d5a7163c33d6864adf3196e38d9968`
- `notice_sha256 = 7070b2a97dc9a59a51d9065316af0dece61114a77e33bfb8fa451bca977da260`

This notice explicitly states that Aurora v2.0 remains valid and is not revoked. **Expected result is KEEP**, with `claim_status(3).state=ACTIVE` and `can_rely(3)=true`; the result has not yet been observed. Obtain the `review_notice(3)` transaction hash, Execution Result and follow-up readback before claiming the negative test passed.

## Build a notice

Create `build/notice_body.txt` with a sentence such as:

> This notice immediately withdraws our Aurora v1.0 integration safety certification in its entirety.

Run locally after deployment and registration, substituting the **actual issuer wallet**:

```bash
python scripts/prepare_notice.py \
  --claim-id 1 --chain-id 61999 \
  --issuer 0xYOUR_FULL_40_HEX_ADDRESS \
  --repo bearbaba/relynx --key aurora-v1 \
  --statement "Issuer certifies library Aurora v1.0 as compliant with the published integration safety policy." \
  --body-file build/notice_body.txt \
  --output notices/aurora-v1.txt
```

Use **exactly** the same lower-case `repo_owner` and `repo_name` as in `register_claim`. The printed `<FULL_40_HEX_COMMIT>` URL becomes permanent after you commit and push the notice. The contract computes the URL internally, so `review_notice()` accepts the 40-character commit, not an arbitrary URL.

### Do not mistakenly make a live claim

This scenario demonstrates a self-issued, illustrative claim and a synthetic retraction, not a real safety certification. A production consumer must verify the issuer's credibility and repo relationship through its own trust policy. These are intentionally different from the cryptographic checks inside RELYNX.
