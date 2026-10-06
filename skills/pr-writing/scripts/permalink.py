#!/usr/bin/env python3
"""Print a GitHub permalink pinned to a full commit SHA.

Run inside the repository:

    python3 permalink.py PATH[:START[-END]] [--ref REF] [--remote NAME]

The script exits with an error instead of guessing when the remote is not on
GitHub, the commit is not on a known branch of that remote, or the file or
line range does not exist at that commit.
"""
import argparse
import re
import subprocess
from pathlib import Path
from urllib.parse import quote

GITHUB_REMOTE = re.compile(
    r"^(?:https://(?:[^@/]+@)?github\.com/|git@github\.com:|ssh://git@github\.com/)"
    r"(?P<owner>[^/]+)/(?P<repo>.+?)(?:\.git)?/?$"
)


def git(*args):
    result = subprocess.run(
        ["git", *args], capture_output=True, text=True, encoding="utf-8", errors="replace"
    )
    if result.returncode != 0:
        raise SystemExit(result.stderr.strip() or f"git {' '.join(args)} failed")
    return result.stdout


def main():
    parser = argparse.ArgumentParser(description="Print a GitHub permalink pinned to a full commit SHA.")
    parser.add_argument("target", help="file path, optionally followed by :START or :START-END")
    parser.add_argument("--ref", default="HEAD", help="commit, branch, or tag to pin (default: HEAD)")
    parser.add_argument("--remote", default="origin", help="remote to link to (default: origin)")
    args = parser.parse_args()

    path, _, lines = args.target.partition(":")
    line_range = re.fullmatch(r"(\d+)(?:-(\d+))?", lines) if lines else None
    if lines and not line_range:
        raise SystemExit(f"Line range must be START or START-END, got: {lines}")

    top = Path(git("rev-parse", "--show-toplevel").strip())
    try:
        relative = Path(path).resolve().relative_to(top.resolve()).as_posix()
    except ValueError:
        raise SystemExit(f"{path} is outside the repository at {top}")

    remote_url = git("remote", "get-url", args.remote).strip()
    remote = GITHUB_REMOTE.match(remote_url)
    if not remote:
        raise SystemExit(f"{args.remote} is not a GitHub remote ({remote_url}). Cite the path and commit in plain text.")

    sha = git("rev-parse", "--verify", f"{args.ref}^{{commit}}").strip()
    on_remote = [b for b in git("branch", "-r", "--contains", sha).split() if b.startswith(f"{args.remote}/")]
    if not on_remote:
        raise SystemExit(
            f"Commit {sha} is not on any known {args.remote} branch. Push or fetch it first, "
            "or cite the path and commit in plain text."
        )

    if subprocess.run(["git", "cat-file", "-e", f"{sha}:{relative}"], capture_output=True).returncode != 0:
        raise SystemExit(f"{relative} does not exist at {sha}")

    anchor = ""
    if line_range:
        start = int(line_range.group(1))
        end = int(line_range.group(2) or start)
        content = git("show", f"{sha}:{relative}")
        count = len(content.splitlines())
        if not 1 <= start <= end <= count:
            raise SystemExit(f"Lines {start}-{end} are outside {relative}, which has {count} lines at {sha}")
        anchor = f"#L{start}" if start == end else f"#L{start}-L{end}"

    print(f"https://github.com/{remote['owner']}/{remote['repo']}/blob/{sha}/{quote(relative)}{anchor}")


if __name__ == "__main__":
    main()
