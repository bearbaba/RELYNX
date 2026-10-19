# RELYNX Consumer Gate — real cross-IC authorization demo

A **separately deployable** Intelligent Contract, not a replacement for `Relynx`. It reads the existing RELYNX contract with `gl.get_contract_at(relynx).view()` and creates an on-chain action receipt **only if** the source claim remains eligible at execution time.

## Scope and risk boundary

- Fixed, constructor-bound RELYNX address, trusted issuer wallet, repository and claim-key prefix.
- Queries both `claim_status(claim_id)` and `can_rely(claim_id)`; checks the claim ID, chain ID, `ACTIVE` state, issuer, repository, prefix and *derived* eligibility.
- A child claim can remain `ACTIVE` but fail `can_rely()` because an ancestor is revoked. The gate **must deny it**.
- Each permitted action creates a durable, actor-bound receipt (`claim_id`, caller address, `action_key`). Rejections revert and must not advance the receipt counter.
- The policy is immutable; errors and malformed/missing sources fail closed. No GEN movement, token escrow, real permissions, or external side effects. This is a **demonstration consumer** suitable for understanding integration, not a permission system for actual funds.
- The source claim creator's GitHub repo assertion has no independent authentication: consumer trusts the pinned issuer and repo by **configuration policy**, not through automatic identity verification.

## Source

[`contracts/relynx_consumer_gate.py`](../contracts/relynx_consumer_gate.py), class `RelynxConsumerGate`.

## Constructor (for Studionet instance)

| Parameter | Value |
| --- | --- |
| `relynx` | `0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa` |
| `issuer` | `0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb` |
| `repository` | `bearbaba/relynx` |
| `key_prefix` | `aurora-` |

Use Normal mode on GenLayer Studionet (chain 61999), simulation OFF. Deploy this **new** consumer alongside the original RELYNX instance; do not re-deploy or mutate the RELYNX source contract.

## Mandatory live acceptance sequence (NOT YET EXECUTED)

1. Read `policy()`, confirm correct RELYNX/issuer/repository/prefix and chain `61999`.
2. Read `receipt_count()` = `0`.
3. Read `can_act(2)` expected `false`: Claim #2 is still `ACTIVE` but `can_rely(2)=false` due to revoked parent #1.
4. Write `perform_action(2, "blocked-v1")` expected `ERROR` with `claim not eligible`. Record complete rejected TX, execution error and unchanged `receipt_count()=0`. Finality alone does not signal success.
5. Read `can_act(3)` expected `true`: Claim #3 is `ACTIVE` and its own review verdict was `KEEP`.
6. Write `perform_action(3, "allowed-v2")` expected `FINALIZED` with Execution `SUCCESS`, returns `1`.
7. Read `receipt_count()` expected `1`, then `receipt(1)` showing `claim_id=3`, caller wallet and `action_key="allowed-v2"`.
8. Save transaction hashes and readbacks in `docs/STUDIONET_EVIDENCE.md`. These are expectations, not assertions of a completed on-chain demo.

## Testing

`tests/test_consumer_local.py` mocks an independent source to exercise trusted-scope checking, live fail-closed transitions and receipt writes; it **does not prove actual inter-contract VM connectivity**. `tests/test_direct_consumer.py` uses official DirectVM to smoke-test deployment and validation before the cross-call. GitHub CI lints both contracts and runs all suites.

The separate consumer uses deterministic synchronous `view()` calls; GenLayer's documented cross-IC API is `gl.get_contract_at(address).view().method(...)`. Studionet integration tests are still required before claiming this works between deployed contracts.
