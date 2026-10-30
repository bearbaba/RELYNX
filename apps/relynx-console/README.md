# RELYNX Console (Project candidate)

**Status:** Frontend build candidate. This is a new GenLayer Project application, separate from the already accepted RELYNX Intelligent Contract contribution. **Do not submit to Project Explorer before a public HTTPS preview has passed actual signed browser testing.**

## Run locally

\`\`\`bash
npm install
npm run dev
\`\`\`

## Deploy

Vercel Vite project root: \`apps/relynx-console\`. Node 22. The application connects to the **existing** Studionet contracts; it does not deploy or upgrade them.

- Source RELYNX: \`0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa\`
- Consumer Gate: \`0xe3421601C4F2Fc5cb5b7922cbA98fA0A6B701B0b\`
- Chain: \`61999\`

## Features

- Finalized-state read-only claim discovery and detail view
- Dependency state and derived \`can_rely\` visibility
- Cross-IC \`can_act\` eligibility read, consumer action receipts
- EIP-1193 wallet connect for Studionet and signed consumer actions
- Register claims and review pinned issuer notices through the existing source contract
- Transaction hash, finalization and **execution result** checks before displaying success
- No fake claims, no mock success displays, no private keys in frontend

## Limitations

- The browser needs working RPC access to Studionet; network resets and website content drift can break historic demo state.
- Wallet extension required for writes. Contract claims are issuer assertions, not universal identity proofs.
- SDK pinned to \`genlayer-js@2.0.0-rc.2\` and must be retested against the deployed Studionet after every SDK upgrade.
- Fee simulations may be costly or fail for expected reverts; never bypass a failed estimate silently.
- A denied transaction can be FINALIZED but execute with ERROR. UI must distinguish these states.
- Existing RELYNX Consumer Gate stores **demo action receipts**, not payments or actual authorization to external resources.

## Before GenLayer Projects submission

- [ ] Vercel preview build READY + public accessibility
- [ ] Live finalized reads of claim #1, #2, #3 and stored action receipt #1
- [ ] Wallet connect/sign on actual Studio-compatible wallet
- [ ] Invalid claim action shown as BLOCKED; valid claim write finalized SUCCESS
- [ ] Claim register/review working for a fresh demo claim, with accurately pinned source digest
- [ ] Browser error and disconnection regression checks
- [ ] One concise screen recording with reproducible How-to, not re-used IC evidence alone
- [ ] New Project Explorer listing, distinct from standalone RELYNX submission

See source RELYNX contract repo [root README](../../README.md) and [consumer live evidence](../../docs/CONSUMER_LIVE_EVIDENCE.md).
