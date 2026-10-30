# RELYNX Console (Project candidate)

**Status (30 October 2026):** Live on Vercel production with newly recorded signed browser transactions in [the October 30 demo](https://youtu.be/TzSONW6uWb0). The public Vercel API was independently re-read after the video: **`claim_count()=4`, `can_act(4)=true`, `receipt(2)` matches Claim #4 and the submitting wallet**. The current total receipt count is 3 (an additional receipt reuses the same action key). This is a **new GenLayer Project web app** that builds on an earlier accepted standalone Intelligent Contract contribution; it is not a re-submission of that IC. See [Project Reviewer Guide](PROJECT_REVIEWER.md).

## Run locally

```bash
npm install
npm run dev
```

## Deployment

[Open the staging build](https://relynx-console-e8ikrrxwk-khaiptk1998-8088s-projects.vercel.app/) (Vercel Authentication may require team login).

Vercel project: `relynx-console` in team `khaiptk1998-8088s-projects`. Git is connected to `bearbaba/RELYNX`; frontend root directory is `apps/relynx-console`. The staging build was deployed from exact GitHub source files, and future repo builds use the configured root. Production is available at **https://relynx-console.vercel.app/**. The signed demo and current API readbacks are documented in the Project Reviewer Guide; the old staging link is retained for historical reference.

## Deploy

Vercel Vite project root: `apps/relynx-console`. Node 22. The application connects to the **existing** Studionet contracts; it does not deploy or upgrade them.

- Source RELYNX: `0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa`
- Consumer Gate: `0xe3421601C4F2Fc5cb5b7922cbA98fA0A6B701B0b`
- Chain: `61999`

## Features

- Finalized-state read-only claim discovery and detail view
- Dependency state and derived `can_rely` visibility
- Cross-IC `can_act` eligibility read, consumer action receipts
- EIP-1193 wallet connect for Studionet and signed consumer actions
- Register claims and review pinned issuer notices through the existing source contract
- Transaction hash, finalization and **execution result** checks before displaying success
- No fake claims, no mock success displays, no private keys in frontend

## Limitations

- Read-only calls go through `api/read.js` (allowlisted, read-only, `LATEST_FINAL`) with the stable `genlayer-js@1.1.8` SDK. This corrects the previous `gen_call` Version failure encountered with `genlayer-js@2.0.0-rc.2` on Studionet. Network changes can still break reads.
- Wallet extension required for writes. Contract claims are issuer assertions, not universal identity proofs.
- Both browser wallet and server API use `genlayer-stable`, pinned to `genlayer-js@1.1.8`. The incompatible `genlayer-js@2.0.0-rc.2` prerelease is no longer a dependency. Keep the Studionet release family consistent.
- The stable Studionet write client sends `value: 0n` and waits for `TransactionStatus.FINALIZED`; successful execution additionally requires `FINISHED_WITH_RETURN`. Verify the wallet signature on the actual Studio-compatible provider before filming. Never retry a transaction automatically when its submitted hash exists.
- A denied transaction can be FINALIZED but execute with ERROR. UI must distinguish these states.
- Existing RELYNX Consumer Gate stores **demo action receipts**, not payments or actual authorization to external resources.

## Before GenLayer Projects submission

- [x] Public production Vercel deployment READY
- [x] External live API reads of claim #2 and #3, both eligibility checks, counters and receipt #1; Claim #1 source revocation evidenced in existing transaction ledger (browser rendering still needs smoke test)
- [x] Actual browser wallet connect + signed Claim #4 and Consumer Gate action shown in the new demo video
- [x] Consumer Gate live read `can_act(2)=false`, `can_act(3)=true`
- [x] Fresh signed Consumer Gate action from web UI stored as `receipt(2)` for Claim #4; transaction success and read-back shown in video
- [x] Fresh Claim #4 registered from browser and independently verified; this registration alone is not an AI notice-review verdict
- [ ] Fresh notice review on a new pinned source (historic REVOKE / KEEP verdicts are documented)
- [ ] Browser error and disconnection regression checks
- [x] New [subtitled signed-wallet screen recording](https://youtu.be/TzSONW6uWb0) with new Claim #4 and Receipt #2
- [ ] New Project Explorer listing, distinct from standalone RELYNX submission (requires Portal submission)

See source RELYNX contract repo [root README](../../README.md) and [consumer live evidence](../../docs/CONSUMER_LIVE_EVIDENCE.md).
