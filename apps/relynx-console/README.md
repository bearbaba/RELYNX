# RELYNX Console (Project candidate)

**Status (30 October 2026):** Vercel production build READY. Stable Studionet RPC reads have been **independently verified from the public Vercel API**: `claim_count=3`, `receipt_count=1`, `can_act(2)=false`, `can_act(3)=true`, and live `claim_status`/`receipt(1)` values. **A fresh browser wallet signature and live write still require builder acceptance.** This is a new GenLayer Project application, separate from the already accepted RELYNX Intelligent Contract contribution. **Do not submit to Project Explorer before a public HTTPS preview has passed actual signed browser testing.**

## Run locally

```bash
npm install
npm run dev
```

## Preview deployment

[Open the staging build](https://relynx-console-e8ikrrxwk-khaiptk1998-8088s-projects.vercel.app/) (Vercel Authentication may require team login).

Vercel project: `relynx-console` in team `khaiptk1998-8088s-projects`. Git is connected to `bearbaba/RELYNX`; frontend root directory is `apps/relynx-console`. The staging build was deployed from exact GitHub source files, and future repo builds use the configured root. The staging build has **not** passed live browser signing checks, and the site is not yet a public Project Explorer submission.

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
- Stable network path uses the `genlayer-stable` npm alias for `genlayer-js@1.1.8` in both browser wallet and server API. `genlayer-js@2.0.0-rc.2` remains as a transitional dependency but is not imported in current frontend/API paths. Avoid mixing these incompatible network release families.
- The stable Studionet write client sends `value: 0n` and waits for `TransactionStatus.FINALIZED`; successful execution additionally requires `FINISHED_WITH_RETURN`. Verify the wallet signature on the actual Studio-compatible provider before filming. Never retry a transaction automatically when its submitted hash exists.
- A denied transaction can be FINALIZED but execute with ERROR. UI must distinguish these states.
- Existing RELYNX Consumer Gate stores **demo action receipts**, not payments or actual authorization to external resources.

## Before GenLayer Projects submission

- [ ] Vercel preview build READY + public accessibility
- [x] External live API reads of claim #2 and #3, both eligibility checks, counters and receipt #1; Claim #1 source revocation evidenced in existing transaction ledger (browser rendering still needs smoke test)
- [ ] Wallet connect/sign on actual Studio-compatible wallet
- [x] Consumer Gate live read `can_act(2)=false`, `can_act(3)=true`
- [ ] Fresh signed Consumer Gate action from web UI finalized SUCCESS and persisted as a new receipt
- [ ] Claim register/review working for a fresh demo claim, with accurately pinned source digest
- [ ] Browser error and disconnection regression checks
- [ ] One concise screen recording with reproducible How-to, not re-used IC evidence alone
- [ ] New Project Explorer listing, distinct from standalone RELYNX submission

See source RELYNX contract repo [root README](../../README.md) and [consumer live evidence](../../docs/CONSUMER_LIVE_EVIDENCE.md).
