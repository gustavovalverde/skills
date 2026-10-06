# Contributing

Read [AGENTS.md](AGENTS.md) before adding or changing a skill. It covers what belongs in a skill, how to write the description and body, how skills refer to each other, and how to verify a change.

After any change, run:

```sh
python3 scripts/check.py
```

The script checks skill frontmatter, body length, reference links, Codex metadata, license copies, external references, manifest consistency, and that the plugin version changed when skills did.

After changing Claude plugin manifests, also run:

```sh
claude plugin validate --strict .claude-plugin/marketplace.json
claude plugin validate --strict .claude-plugin/plugin.json
```

When changing a skill's trigger or instructions, try a request that should activate it and a nearby request that should not. The [review examples](docs/review-examples.json) supply sample inputs, including near misses between sibling skills. Check factual accuracy and usefulness; expected wording is not a test.

Before releasing an installation change, check discovery and install in an empty temporary project.

Add external sources to [the reference index](docs/references.md), including links cited inside individual skills. Preserve attribution and confirm redistribution rights; see [licensing](docs/provenance.md).
