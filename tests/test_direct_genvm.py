"""Official GenLayer SDK DirectVM smoke tests, not a proof of live consensus."""
import json
import pytest


@pytest.fixture
def relynx(direct_vm, direct_deploy):
    direct_vm.check_pickling = True
    return direct_deploy("contracts/relynx.py")


STATEMENT = "Issuer certifies library Aurora v1.0 as compliant with the published integration safety policy."


def test_register_real_genvm_storage_and_dependency(relynx):
    a = relynx.register_claim("bearbaba", "relynx", "aurora-v1", STATEMENT, 0, 0)
    b = relynx.register_claim("bearbaba", "relynx", "service-b", STATEMENT, a, 0)
    c = relynx.register_claim("bearbaba", "relynx", "agent-c", STATEMENT, b, 0)
    assert (a, b, c) == (1, 2, 3)
    assert relynx.claim_count() == 3
    assert relynx.can_rely(c) is True
    status = json.loads(relynx.claim_status(c))
    assert status["depth"] == 3
    assert status["parent_a"] == 2
    assert status["can_rely"] is True


def test_directvm_rejects_bad_graph_and_unpinned_notice(relynx):
    a = relynx.register_claim("bearbaba", "relynx", "aurora-v1", STATEMENT, 0, 0)
    with pytest.raises(Exception):
        relynx.register_claim("bearbaba", "relynx", "bad", STATEMENT, a, a)
    with pytest.raises(Exception):
        relynx.review_notice(a, "main", "f" * 64)
    assert relynx.can_rely(a) is True
    assert relynx.claim_count() == 1


def test_any_sender_can_create_self_issued_attestation(relynx, direct_vm, direct_alice):
    with direct_vm.prank(direct_alice):
        idx = relynx.register_claim("bearbaba", "relynx", "alice-claim", STATEMENT, 0, 0)
    assert idx == 1
    state = json.loads(relynx.claim_status(1))
    assert state["issuer"].lower() == str(direct_alice).lower()
    assert relynx.can_rely(1) is True
