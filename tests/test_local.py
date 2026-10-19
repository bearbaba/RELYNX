"""Deterministic safety invariants; mocked nondeterminism is not GenLayer consensus."""
import importlib.util
import json
import sys
import types
from dataclasses import dataclass
from pathlib import Path

import pytest


class Address(str):
    def __new__(cls, value):
        if not isinstance(value, str) or not value.startswith("0x") or len(value) != 42:
            raise ValueError("address")
        return str.__new__(cls, value.lower())

    @property
    def as_hex(self):
        return str(self)


class UserError(Exception):
    pass


class FakeMap(dict):
    def __class_getitem__(cls, unused):
        return cls


def fake_genlayer():
    module = types.ModuleType("genlayer")
    module.Address, module.u256 = Address, int
    module.TreeMap = FakeMap
    module.allow_storage = lambda cls: cls
    module.gl = types.SimpleNamespace(
        Contract=object,
        vm=types.SimpleNamespace(UserError=UserError),
        public=types.SimpleNamespace(write=lambda fn: fn, view=lambda fn: fn),
        message=types.SimpleNamespace(sender_address=Address("0x" + "a" * 40), chain_id=61999),
        nondet=types.SimpleNamespace(
            web=types.SimpleNamespace(render=lambda url, mode: ""),
            exec_prompt=lambda prompt: "{}"),
        eq_principle=types.SimpleNamespace(prompt_comparative=lambda evaluate, principle: evaluate()))
    return module


@pytest.fixture
def fixture(monkeypatch):
    fake = fake_genlayer()
    monkeypatch.setitem(sys.modules, "genlayer", fake)
    spec = importlib.util.spec_from_file_location(
        "relynx_under_test", Path(__file__).resolve().parents[1] / "contracts" / "relynx.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    contract = module.Relynx()
    contract.claims = {}
    return module, contract, fake.gl


STATEMENT = "Issuer certifies library Aurora v1.0 as compliant with the published integration safety policy."
REVOKE_QUOTE = "This notice immediately withdraws our Aurora v1.0 integration safety certification in its entirety."
KEEP_QUOTE = "This notice concerns Aurora v2.0 only and does not modify the existing Aurora v1.0 certification."


def mk_notice(mod, contract, claim_id, body=REVOKE_QUOTE, chain="61999", issuer=None,
              key=None, statement_sha=None):
    c = contract._claim(claim_id)
    return (f"{mod.MAGIC}\nCHAIN_ID: {chain}\nCLAIM_ID: {claim_id}\n"
            f"ISSUER: {issuer or c.issuer.as_hex.lower()}\n"
            f"REPO: {c.repo_owner}/{c.repo_name}\n"
            f"KEY: {key or c.key}\n"
            f"STATEMENT_SHA256: {statement_sha or c.statement_sha256}\n\n"
            f"[NOTICE]\n{body}")


def add_claim(fixture, parent_a=0, parent_b=0, key="aurora-v1"):
    mod, contract, gl = fixture
    return contract.register_claim("bearbaba", "relynx", key, STATEMENT,
                                   parent_a, parent_b)


def review(fixture, claim_id, body, answer, expected=None):
    mod, contract, gl = fixture
    notice = mk_notice(mod, contract, claim_id, body=body)
    gl.nondet.web.render = lambda url, mode: notice
    gl.nondet.exec_prompt = lambda _: json.dumps(answer)
    result = contract.review_notice(claim_id, "a" * 40, mod.digest(notice))
    if expected is not None:
        assert result == expected
    return notice


def test_registration_and_dependency_graph(fixture):
    mod, r, gl = fixture
    a = add_claim(fixture)
    b = add_claim(fixture, parent_a=a, key="aurora-service")
    c = add_claim(fixture, parent_a=b, key="aurora-agent")
    d = add_claim(fixture, parent_a=a, parent_b=c, key="aurora-multisig")
    assert (a, b, c, d) == (1, 2, 3, 4)
    assert r.claim_count() == 4
    assert all(r.can_rely(x) for x in (a, b, c, d))
    state = json.loads(r.claim_status(d))
    assert state["parent_b"] == 3 and state["depth"] == 4
    with pytest.raises(UserError, match="depth exceeded"):
        add_claim(fixture, parent_a=d, key="too-deep")
    with pytest.raises(UserError, match="invalid parent pair"):
        add_claim(fixture, parent_a=a, parent_b=a, key="dup-parent")
    with pytest.raises(UserError, match="parent must precede"):
        add_claim(fixture, parent_a=44, key="future-parent")
    with pytest.raises(UserError, match="unknown claim"):
        r.can_rely(55)
    assert r.claim_count() == 4


def test_explicit_withdrawal_revokes_and_cascades_without_child_writes(fixture):
    mod, r, gl = fixture
    root = add_claim(fixture)
    child = add_claim(fixture, parent_a=root, key="downstream-app")
    grandchild = add_claim(fixture, parent_a=child, key="downstream-agent")
    untouched = add_claim(fixture, key="unrelated")
    before = r.claim_status(child)
    review(fixture, root, REVOKE_QUOTE,
           {"decision": "REVOKE", "quote": REVOKE_QUOTE}, "REVOKE")
    assert not r.can_rely(root)
    assert not r.can_rely(child)
    assert not r.can_rely(grandchild)
    assert r.can_rely(untouched)
    after = json.loads(r.claim_status(child))
    assert json.loads(before)["state"] == after["state"] == "ACTIVE"
    assert after["can_rely"] is False
    assert json.loads(r.claim_status(root))["revocation_url"].endswith("/notices/aurora-v1.txt")
    with pytest.raises(UserError, match="already revoked"):
        r.review_notice(root, "b" * 40, "d" * 64)


def test_unrelated_correction_keeps_claim_active(fixture):
    mod, r, gl = fixture
    root = add_claim(fixture)
    notice = review(fixture, root, KEEP_QUOTE,
                    {"decision": "KEEP", "quote": KEEP_QUOTE}, "KEEP")
    assert r.can_rely(root)
    s = json.loads(r.claim_status(root))
    assert s["last_decision"] == "KEEP"
    with pytest.raises(UserError, match="already reviewed"):
        r.review_notice(root, "a" * 40, mod.digest(notice))


def test_ambiguous_correction_not_a_revocation(fixture):
    mod, r, gl = fixture
    root = add_claim(fixture)
    note = "The Aurora v1.0 policy may be revised later pending additional board approval and assessment."
    review(fixture, root, note, {"decision": "UNVERIFIABLE", "quote": ""}, "UNVERIFIABLE")
    assert r.can_rely(root)
    assert json.loads(r.claim_status(root))["last_decision"] == "UNVERIFIABLE"


def test_bogus_citation_cannot_revoke(fixture):
    mod, r, gl = fixture
    root = add_claim(fixture)
    review(fixture, root, KEEP_QUOTE,
           {"decision": "REVOKE", "quote": REVOKE_QUOTE}, "UNVERIFIABLE")
    assert r.can_rely(root)


def test_source_hash_mismatch_and_recovery(fixture):
    mod, r, gl = fixture
    root = add_claim(fixture)
    doc = mk_notice(mod, r, root)
    gl.nondet.web.render = lambda url, mode: doc + " malicious"
    assert r.review_notice(root, "a" * 40, mod.digest(doc)) == "SOURCE_MISMATCH"
    assert json.loads(r.claim_status(root))["last_decision"] == ""
    assert r.can_rely(root)
    gl.nondet.web.render = lambda url, mode: doc
    gl.nondet.exec_prompt = lambda _: json.dumps({"decision": "REVOKE", "quote": REVOKE_QUOTE})
    assert r.review_notice(root, "a" * 40, mod.digest(doc)) == "REVOKE"
    assert not r.can_rely(root)


def test_offline_source_is_nonterminal(fixture):
    mod, r, gl = fixture
    root = add_claim(fixture)
    def offline(url, mode):
        raise TimeoutError("offline")
    gl.nondet.web.render = offline
    assert r.review_notice(root, "a" * 40, "f" * 64) == "SOURCE_UNAVAILABLE"
    assert r.can_rely(root)


def test_wrong_scopes_do_not_revoke(fixture):
    mod, r, gl = fixture
    root = add_claim(fixture)
    for text in (
        mk_notice(mod, r, root, chain="1"),
        mk_notice(mod, r, root, key="wrong-key"),
        mk_notice(mod, r, root, statement_sha="a" * 64),
        mk_notice(mod, r, root, issuer="0x" + "f" * 40)):
        gl.nondet.web.render = lambda url, mode, data=text: data
        gl.nondet.exec_prompt = lambda _: json.dumps({"decision": "REVOKE", "quote": REVOKE_QUOTE})
        assert r.review_notice(root, "a" * 40, mod.digest(text)) == "INVALID_SCOPE"
        assert r.can_rely(root)
    assert json.loads(r.claim_status(root))["last_decision"] == ""


def test_reviewer_is_permissionless_but_source_repo_immutable(fixture):
    mod, r, gl = fixture
    root = add_claim(fixture)
    gl.message.sender_address = Address("0x" + "b" * 40)
    notice = mk_notice(mod, r, root)
    urls = []
    def render(url, mode):
        urls.append(url)
        return notice
    gl.nondet.web.render = render
    gl.nondet.exec_prompt = lambda _: json.dumps({"decision": "REVOKE", "quote": REVOKE_QUOTE})
    assert r.review_notice(root, "a" * 40, mod.digest(notice)) == "REVOKE"
    assert urls == [mod.source_url("bearbaba", "relynx", "a" * 40, "aurora-v1")]
    assert not r.can_rely(root)


def test_reject_unpinned_consensus_decision(fixture):
    mod, r, gl = fixture
    root = add_claim(fixture)
    doc = mk_notice(mod, r, root)
    gl.eq_principle.prompt_comparative = lambda observe, principle: json.dumps({
        "decision": "REVOKE", "source_sha256": "b" * 64,
        "quote": REVOKE_QUOTE})
    with pytest.raises(UserError, match="terminal source digest mismatch"):
        r.review_notice(root, "a" * 40, mod.digest(doc))
    assert r.can_rely(root)


def test_invalid_inputs_cannot_mutate_graph(fixture):
    mod, r, gl = fixture
    with pytest.raises(UserError, match="invalid issuer repository"):
        r.register_claim("fake.com/forged", "repo", "key", STATEMENT, 0, 0)
    with pytest.raises(UserError, match="invalid claim key"):
        r.register_claim("bearbaba", "relynx", "../escape", STATEMENT, 0, 0)
    with pytest.raises(UserError, match="invalid claim statement"):
        r.register_claim("bearbaba", "relynx", "key", "tiny", 0, 0)
    idx = add_claim(fixture)
    with pytest.raises(UserError, match="full lowercase SHA-1"):
        r.review_notice(idx, "main", "f" * 64)
    with pytest.raises(UserError, match="invalid notice digest"):
        r.review_notice(idx, "a" * 40, "bad")
    assert r.claim_count() == 1
