"""Local deterministic consumer policy tests. Fake source != live cross-IC proof."""
import importlib.util
import json
import sys
import types
from dataclasses import dataclass
from pathlib import Path

import pytest


class Address(str):
    @property
    def as_hex(self):
        return str(self)


class UserError(Exception):
    pass


class FakeMap(dict):
    def __class_getitem__(cls, key):
        return cls


RELYNX = Address("0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa")
ISSUER = Address("0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb")
ACTOR = Address("0x" + "a" * 40)


@pytest.fixture
def setup(monkeypatch):
    fake = types.ModuleType("genlayer")
    fake.Address, fake.u256, fake.TreeMap = Address, int, FakeMap
    fake.allow_storage = lambda c: c
    fake.dataclass = dataclass
    live = {
        2: {"claim_id": 2, "chain_id": "61999", "state": "ACTIVE",
            "repo": "bearbaba/relynx", "issuer": str(ISSUER),
            "key": "aurora-service", "can_rely": False},
        3: {"claim_id": 3, "chain_id": "61999", "state": "ACTIVE",
            "repo": "bearbaba/relynx", "issuer": str(ISSUER),
            "key": "aurora-v2", "can_rely": True}
    }
    class View:
        def claim_status(self, i):
            return json.dumps(live[i])
        def can_rely(self, i):
            return live[i]["can_rely"]
    class Source:
        def view(self):
            return View()
    gl = types.SimpleNamespace(
        Contract=object, vm=types.SimpleNamespace(UserError=UserError),
        public=types.SimpleNamespace(write=lambda f: f, view=lambda f: f),
        message=types.SimpleNamespace(sender_address=ACTOR, chain_id=61999),
        get_contract_at=lambda address: Source() if address == RELYNX else None
    )
    fake.gl = gl
    monkeypatch.setitem(sys.modules, "genlayer", fake)
    spec = importlib.util.spec_from_file_location(
        "relynx_consumer_under_test",
        Path(__file__).resolve().parents[1] / "contracts" / "relynx_consumer_gate.py")
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    gate = mod.RelynxConsumerGate(RELYNX, ISSUER, "bearbaba/relynx", "aurora-")
    gate.receipts = {}
    return gate, live, gl


def test_live_dependency_check_blocks_child_and_stores_no_receipt(setup):
    gate, live, gl = setup
    assert gate.can_act(2) is False
    with pytest.raises(UserError, match="claim not eligible"):
        gate.perform_action(2, "blocked-v1")
    assert gate.receipt_count() == 0


def test_valid_claim_creates_attributable_receipt(setup):
    gate, live, gl = setup
    assert gate.can_act(3) is True
    assert gate.perform_action(3, "allowed-v2") == 1
    assert gate.receipt_count() == 1
    receipt = json.loads(gate.receipt(1))
    assert receipt == {"receipt_id": 1, "claim_id": 3,
                       "actor": str(ACTOR), "action_key": "allowed-v2"}


def test_revocation_is_checked_again_on_every_action(setup):
    gate, live, gl = setup
    gate.perform_action(3, "before-change")
    live[3]["can_rely"] = False
    assert gate.can_act(3) is False
    with pytest.raises(UserError, match="claim not eligible"):
        gate.perform_action(3, "after-change")
    assert gate.receipt_count() == 1


@pytest.mark.parametrize("field,value", [
    ("issuer", "0x" + "b" * 40),
    ("repo", "fake/repo"),
    ("chain_id", "1"),
    ("key", "unrelated"),
    ("state", "REVOKED"),
    ("claim_id", 99),
    ("can_rely", False),
])
def test_fails_closed_on_wrong_scope_or_untrusted_claim(setup, field, value):
    gate, live, gl = setup
    live[3][field] = value
    assert gate.can_act(3) is False
    with pytest.raises(UserError, match="claim not eligible"):
        gate.perform_action(3, "unauthorized")
    assert gate.receipt_count() == 0


def test_source_unavailable_is_denied(setup):
    gate, live, gl = setup
    del live[3]
    assert gate.can_act(3) is False
    with pytest.raises(UserError, match="claim not eligible"):
        gate.perform_action(3, "missing-source")
    assert gate.receipt_count() == 0


def test_action_validation_and_unknown_receipt(setup):
    gate, live, gl = setup
    with pytest.raises(UserError, match="invalid action key"):
        gate.perform_action(3, "!bad")
    with pytest.raises(UserError, match="unknown receipt"):
        gate.receipt(1)
    assert gate.receipt_count() == 0


def test_constructor_rejects_invalid_source_policy(setup):
    gate, live, gl = setup
    c = gate.__class__
    with pytest.raises(UserError, match="zero trusted address"):
        c(Address("0x" + "0" * 40), ISSUER, "bearbaba/relynx", "aurora-")
    with pytest.raises(UserError, match="invalid trusted repository"):
        c(RELYNX, ISSUER, "fake/../repo", "aurora-")
    with pytest.raises(UserError, match="invalid key prefix"):
        c(RELYNX, ISSUER, "bearbaba/relynx", "../")
