# RELYNX V1 — Architecture, trust and consensus

## Question answered

An issuer's signed registration declares a specific attestation. Later, a reviewer presents a notice hosted at the *pre-registered issuer's GitHub repository*. Is that notice an **effective, explicit withdrawal of this exact attestation**, or only commentary, a future intention, an unrelated product/version, or insufficient evidence? Hashes cannot answer this question.

## State transitions

```text
register_claim() --> ACTIVE -- review_notice() + explicit effective withdrawal --> REVOKED
                         |
                         +-- KEEP / UNVERIFIABLE --> ACTIVE (record last review)
                         +-- SOURCE_* / INVALID_SCOPE --> ACTIVE (no state write)

REVOKED is terminal. A dependent child can remain locally ACTIVE while its
can_rely(child) becomes false because one ancestor is REVOKED.
```

## Deterministic parts

1. Registration is an on-chain issuer wallet's own assertion; the caller is recorded as `issuer`, along with a repository owner, repository name, unique key within that record, exact statement and its SHA-256. No external permission is inferred merely from registration.
2. Children may reference zero, one, or two earlier claim IDs, and are bounded to four levels. The parent-ID monotonic rule forbids dependency cycles. `can_rely` evaluates a maximum of 15 nodes; revocation is an on-demand derived result, not a risky storage cascade.
3. A challenger cannot substitute its own document host, branch, account, or path. Contract builds URL from registered repo/key and a full lower-case 40-character commit hash. Document content must be SHA-256-equal to the caller's digest. The digest must be checked independently by GenLayer validators.
4. Exact header binds `CHAIN_ID`, `CLAIM_ID`, `ISSUER`, `REPO`, `KEY` and original `STATEMENT_SHA256`; misleading notices about other records fail before semantic reasoning.
5. Source/unavailability/hash/scope failures are distinct nonterminal outputs. A consensus result that claims a terminal semantic verdict without the pinned full SHA-256 cannot revoke.
6. `REVOKE` and `KEEP` both require a quote of 24–240 characters drawn verbatim from the scoped notice body. `UNVERIFIABLE` requires an empty quotation.

## Nondeterministic comparative consensus

`gl.eq_principle.prompt_comparative(observe, principle)` has each validator independently:

- Read the commit-pinned GitHub raw notice via `gl.nondet.web.render`.
- Check full notice SHA-256 against the given digest and exact identity envelope.
- Compare the issuer's original on-chain statement to the notice's semantics: its **subject, scope, version, whether the withdrawal is effective now**, and whether the notice really revokes rather than raises concerns.
- Return structured `REVOKE`, `KEEP`, or `UNVERIFIABLE` with supporting verbatim evidence, or a transport/scope diagnostic.

The equivalence principle explicitly disallows treating a non-revocation (`KEEP`), an ambiguous result, or a transport failure as a revocation. Different cited spans are equivalent only if they establish the **same effective withdrawal**. The caller re-checks the terminal source digest, supported JSON shape, and quote size after consensus.

## Trust and integration model

Consumer contracts or off-chain agents should first recognize `claim_status(id).issuer`, registered claim identity and intended scope; **only then** use `can_rely(id)`. Treating all open-registered claims as reputable would be unsafe. Parent dependencies express the issuer's policy and can only reduce derived reliance, not create global validity.

An issuer may publish a misleading notice in its own repo; a compromised GitHub account may publish a malicious notice; a historic revoked notice may remain accessible after replacement. A hash and commit pin do not authenticate GitHub account control by the on-chain wallet, nor do they prove temporal freshness or the real-world veracity of a claim. V1 explicitly assumes consumers have an independent reason to trust the registering issuer and its chosen repo.

## Suggested bounded live demonstration

- Root cert A and dependent cert B created by the same issuer wallet. Confirm both are ACTIVE and `can_rely(B)=true`.
- An issuer-repo notice that **actually revokes A** is committed to GitHub under `notices/<root-key>.txt`; run `review_notice(A, pinned_git_commit, exact_sha256)` with full consensus.
- Verify A becomes `REVOKED`, while B is still locally `ACTIVE` but `can_rely(B)=false` with **no write to B**.
- Test an unrelated version-only notice against a separate root C to get `KEEP`, and try a wrong-scope notice to show no revocation.
- Compare a live consumer's reliance check only when a compatible GenLayer contract-to-contract view API is tested; do not call unverified integration code production-ready.
