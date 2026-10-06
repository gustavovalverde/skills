# Citing sources

When a change aligns code, documentation, or configuration with an external fact:

- End with a `Sources:` list of every external fact the change relies on. Also link a fact inline where the body argues from it, such as a disputed claim or a comparison.
- Prefer targets that stay stable and show the fact itself: documentation anchors, permalinks pinned to a full commit SHA and line range, and machine-readable registry or schema URLs. Keep the line range in the Sources entry. When the body compares two locations, link both.
- Build each URL from the repository's actual remote, path, and commit with the skill's permalink script; never guess one. When the remote is unknown or the commit is not pushed, cite the path and commit in plain text.
- Open every link before publishing. If you cannot, tell whoever requested the description; the body is not the place to report verification status.
- The pull request's date already dates the evidence, so omit "checked on" dates.
- Cite only material every reader can open.
- Use the evidence's own wording: deprecated is not removed, and exposed is not leaked. Mark inferences as inferences.
- When sources conflict, say which one the change follows and who can correct the other.
