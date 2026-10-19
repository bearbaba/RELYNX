"""Build byte-stable, case-scoped issuer notice for RELYNX Studio.

Example:
python scripts/prepare_notice.py --claim-id 1 --chain-id 61999 \
 --issuer 0x... --repo bearbaba/RELYNX --key aurora-v1 \
 --statement 'Issuer certifies ...' --body-file build/notice_body.txt \
 --output notices/aurora-v1.txt

The notice's Git commit must be pinned before calling review_notice.
"""
import argparse
import hashlib
from pathlib import Path
import re


def sha(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--claim-id", type=int, required=True)
    p.add_argument("--chain-id", required=True)
    p.add_argument("--issuer", required=True)
    p.add_argument("--repo", required=True, help="e.g. bearbaba/RELYNX")
    p.add_argument("--key", required=True)
    p.add_argument("--statement", required=True)
    p.add_argument("--body-file", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True)
    args = p.parse_args()

    if args.claim_id < 1 or not re.fullmatch(r"[0-9]+", args.chain_id):
        p.error("invalid claim or chain ID")
    if not re.fullmatch(r"0x[0-9a-fA-F]{40}", args.issuer):
        p.error("issuer must be a 42-character address")
    if not re.fullmatch(r"[a-z0-9-]+/[a-z0-9_.-]+", args.repo):
        p.error("repository must be canonical lower-case owner/repo")
    if not re.fullmatch(r"[a-z0-9][a-z0-9_-]{2,47}", args.key):
        p.error("invalid key")
    if not 32 <= len(args.statement) <= 500 or "\r" in args.statement:
        p.error("invalid statement length or newlines")
    body = args.body_file.read_text(encoding="utf-8").strip("\n")
    if not 30 <= len(body) <= 3200 or "\r" in body or "[NOTICE]" in body:
        p.error("invalid notice body")
    notice = (
        "RELYNX_NOTICE_V1\n" +
        "CHAIN_ID: " + args.chain_id + "\n" +
        "CLAIM_ID: " + str(args.claim_id) + "\n" +
        "ISSUER: " + args.issuer.lower() + "\n" +
        "REPO: " + args.repo + "\n" +
        "KEY: " + args.key + "\n" +
        "STATEMENT_SHA256: " + sha(args.statement) + "\n\n" +
        "[NOTICE]\n" + body
    )
    if len(notice.encode("utf-8")) > 4096:
        p.error("notice too large")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(notice.encode("utf-8"))
    print("output:", args.output)
    print("statement_sha256:", sha(args.statement))
    print("notice_sha256:", sha(notice))
    print("commit-pinned notice URL (after pushing a commit):")
    owner, repo = args.repo.split("/")
    print(f"https://raw.githubusercontent.com/{owner}/{repo}/<FULL_40_HEX_COMMIT>/notices/{args.key}.txt")
    print("IMPORTANT: after committing, verify the raw bytes/hash before calling review_notice")


if __name__ == "__main__":
    main()
