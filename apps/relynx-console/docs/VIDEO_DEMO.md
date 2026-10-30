# RELYNX Console — 90-second reviewer video

Use the **live** website: https://relynx-console.vercel.app/ and the existing GenLayer Studionet deployment. Do not record claims about successful writes until the actual browser transaction shows success.

## Single take

1. **0–10 seconds:** Open the app. Show the claim counter, receipt counter, and *GenLayer Studionet*. Read-only browsing works without a wallet.
2. **10–25 seconds:** Select **Claim #2**. Explain: it remains individually ACTIVE but its parent was revoked, so it is not eligible; show the current on-chain **Consumer Gate: BLOCKED**.
3. **25–38 seconds:** Select **Claim #3**. Explain: this independent claim was reviewed with KEEP and remains eligible. Show **Consumer Gate: ALLOWED**.
4. **38–48 seconds:** Connect your own wallet on GenLayer Studionet (61999). Show the wallet address and that **Disconnect** works.
5. **48–80 seconds:** In **Check. Sign. Verify.**, choose **#3**, click **Check on-chain**, enter a short unique action reference (e.g. `reviewer-demo-2`) and click **Sign & store receipt**. Approve in the wallet. Wait for **Finalized and executed successfully**. Open the Explorer link.
6. **80–90 seconds:** Show the latest stored receipt, including ID, claim, actor and action key; briefly open the GitHub evidence link.

Keep issuer tools collapsed in this video unless separately demonstrating a new, correctly pinned notice. Do not attempt `review_notice` with a test hash — a real revoke is irreversible.

## Acceptance gates

- Live counters display integers, not **Unavailable**.
- Both Claim #2 and #3 can be read, with contrasting allowed/blocked behavior.
- Wallet connects on chain **61999**; a real signed write returns a hash.
- Finalization and **GenVM successful execution** are both confirmed; the UI must not call a rolled-back transaction SUCCESS.
- Receipt counter increments and new receipt content matches signer, action key and claim.
- If the read-only server fallback or RPC is unavailable, stop and report the actual error instead of editing the video to suggest it worked.

No real credentials, inventory, payments or permissions are certified by this demo.
