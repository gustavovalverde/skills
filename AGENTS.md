# Repository guidance

This repository publishes independent agent skills for Claude Code, Codex, and other Agent Skills clients. The [Agent Skills specification](https://agentskills.io/specification) defines the file format. This file records the choices the specification leaves to authors.

## Decide whether guidance belongs in a skill

Add or keep a skill only when it changes how an agent handles a recurring engineering or writing decision that the agent gets wrong without it. Confirm this with a run that compares the skill against no skill.

- Personal or project conventions, such as spelling, punctuation, approval rules, and tool preferences, belong in the consumer's instructions file.
- Rules a script can check belong in `scripts/`, not in prose.
- Extend an existing skill when the guidance serves the same decision and the same requests. Create a new skill when it has its own triggering requests and works without the others.

## Write the description

Agents choose a skill from its `name` and `description` alone. Write the description in three parts:

1. The decision the skill covers, in words users type, including common synonyms such as "README", "ADR", or "changelog".
2. `Use when` and the requests or situations that should load it, including ones where the user does not name the domain.
3. `Not for` and the nearest requests that should load a sibling or no skill, naming the sibling.

Leave the procedure out of the description. An agent can act on a summarized procedure without reading the body. Stay under 1,024 characters and avoid angle brackets.

## Shape SKILL.md

Keep the body under 600 words. Use this order and omit any section that would be empty:

1. An imperative H1 and one or two sentences that state the stance.
2. The approach, as short paragraphs or numbered steps, each with its reason.
3. `## Gotchas`, listing concrete corrections to mistakes an agent makes without the skill. Keep the most important ones here rather than only in references, because the agent may not recognize when to look for them.
4. `## Finish`, describing a good result and the final check, such as the deletion pass in `ui-copy`.
5. Reference links, each with the condition that makes the file worth reading.

When the problem is the shape of the output, describe the output you want instead of listing what to avoid. Write an exception as its own condition on something the agent can observe, rather than adding an "unless" clause to a rule.

## Connect skills without coupling them

Each skill must work when installed alone.

- Refer to a sibling by its name, followed by "when available" and the condition that calls for it. Do not make a sibling required or link into its files.
- When one skill hands work to another, state what to pass along, such as the representative task or the settled ownership, so the next skill does not repeat the investigation.
- `software-design` states once that focused skills are optional. Other skills do not repeat that loading another skill is unnecessary.
- Small duplication across skills is acceptable when independence requires it. Within one skill, state each rule once; a reference file may work through an example of a rule stated in `SKILL.md`.

| From | To | When |
|---|---|---|
| `software-design` | `public-api-design`, `codebase-structure`, `identifier-naming` | A decision concerns caller usage, placement, or vocabulary |
| `software-design` | `docs-writing` | The user asks to record the decision as an ADR or proposal |
| `codebase-structure` | `identifier-naming` | Ownership is settled and terminology is still disputed |
| `identifier-naming` | `codebase-structure` | A name cannot be chosen because ownership or placement is unsettled |
| `backlog-triage` | `advisory-triage` | A report needs private security handling |
| `advisory-triage` | `backlog-triage` | A report turns out to be ordinary engineering work |

`codebase-structure` owns the checks for moving and renaming paths. `identifier-naming` keeps only the path checks a rename needs when it is installed alone.

## References, scripts, and sources

- Keep references one level deep and link each one from `SKILL.md`.
- Use `examples.md` for decision examples that contrast a tempting change with the right call.
- Add a script under `scripts/` when an operation is deterministic and easy to get wrong in prose, such as building a commit-pinned link. Scripts run without installing packages, on the Python 3 standard library or Node.js 20+ built-ins, and fail with an actionable message instead of guessing. Ship offline tests beside any script that holds logic, as `*.test.mjs` for `node --test` or a Python test.
- Keep `sources.md` for attribution and applicability limits. Link it from `SKILL.md` only when the agent needs it to complete the task.
- Links inside a skill must resolve when the skill is installed alone. Add every external link to `docs/references.md` as well.

## Packaging

- Name each skill folder exactly as its `name` field. Use only `name`, `description`, `license`, `allowed-tools`, and `metadata` in frontmatter; other keys are not portable across clients.
- Give every skill an `agents/openai.yaml` with a quoted `display_name`, a `short_description` of 25 to 64 characters, and a `default_prompt` that mentions `$skill-name`.
- Keep the Claude and Codex plugin manifests and both marketplace files in sync.
- Bump the plugin version in both manifests whenever a skill changes. Installed copies use the version to decide whether an update exists.
- The plugin name is the command namespace. Once published, it changes only through a `renames` entry in `.claude-plugin/marketplace.json`.

## Verify a change

- Run `python3 scripts/check.py` after every change. It enforces the frontmatter, length, linking, metadata, license, and version rules above.
- Run `claude plugin validate --strict` on both Claude manifests after changing them.
- Before and after changing a description, run `python3 scripts/trigger_eval.py` on the examples in `docs/review-examples.json`, which include near misses that share keywords but need a different skill or none. It runs each example several times in isolated Claude Code sessions, because triggering varies between runs and installed copies of these skills would otherwise compete. Use `--ref origin/main` for the baseline and `--with-installed` to include your other skills as competitors.
- Check a description change against a few fresh requests that were not used to tune it, so the wording generalizes instead of matching the examples.
- Before adding guidance, run the relevant examples with and without the skill. Keep guidance that changes the result and remove guidance that does not.
- When an agent needs correcting while using a skill, add the correction as a gotcha.

## Human-facing documentation

When creating or substantially revising this repository's human-facing documentation, read `skills/docs-writing/SKILL.md` and its relevant reference. Mechanical corrections do not need a skill.

Keep the README focused on what the skills do, how to start, and how to use them. Put alternate installation routes and maintainer procedures in linked documents. Verify commands and publication status before presenting them as available.

Use `pr-writing` for PR titles and descriptions. Use `text-editing` when an editorial review is requested.

Keep published prose focused on its reader. Remove migration history, conversation references, and editing or verification narration unless that history is necessary to use or maintain the artifact.
