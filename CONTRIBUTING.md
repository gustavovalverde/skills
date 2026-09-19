# Contributing

Keep each skill focused on a useful task and independent of personal configuration. Use `skills/write-docs/SKILL.md` when substantially changing human-facing documentation.

After changing references or plugin metadata, run:

```sh
python3 scripts/check.py
```

After changing Claude plugin manifests, also run:

```sh
claude plugin validate --strict .claude-plugin/marketplace.json
claude plugin validate .claude-plugin/plugin.json
```

Claude warns that the root `CLAUDE.md` is not loaded as installed plugin context. That file is for contributors working in this repository; the skills contain their own instructions.

When changing a skill's trigger or instructions, try a relevant request and a nearby request that should not activate it. The optional [review examples](docs/review-examples.json) supply sample inputs. Check factual accuracy and usefulness; expected wording is not a test.

Before releasing an installation change, check discovery and install in an empty temporary project. Keep native plugin versions in sync.

Add external sources to [the reference index](docs/references.md), including links cited inside individual skills. Preserve attribution and confirm redistribution rights; see [licensing](docs/provenance.md).
