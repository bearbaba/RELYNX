"""Official DirectVM smoke checks for consumer deployment and storage.

DirectVM does not substitute for a live Studionet cross-contract view call.
The source eligibility checks are unit-tested with a controllable fake; the
A/B network integration remains a required separate verification.
"""
import json
import pytest


RELYNX = "0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa"
ISSUER = "0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb"


def test_consumer_constructor_and_policy(direct_vm, direct_deploy):
    direct_vm.check_pickling = True
    c = direct_deploy("contracts/relynx_consumer_gate.py",
                      RELYNX, ISSUER, "bearbaba/relynx", "aurora-")
    assert c.receipt_count() == 0
    settings = json.loads(c.policy())
    assert settings["repository"] == "bearbaba/relynx"
    assert settings["key_prefix"] == "aurora-"
    # DirectVM test harness defaults to chain 1; deployed Studionet is 61999.
    assert settings["chain_id"] == "1"
    with direct_vm.expect_revert("unknown receipt"):
        c.receipt(1)


def test_invalid_action_reverts_before_cross_contract_access(direct_vm, direct_deploy):
    c = direct_deploy("contracts/relynx_consumer_gate.py",
                      RELYNX, ISSUER, "bearbaba/relynx", "aurora-")
    with direct_vm.expect_revert("invalid action key"):
        c.perform_action(3, "?not-valid")
    assert c.receipt_count() == 0
