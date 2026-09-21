# Moves and verification

## Establish what a path means

Inspect imports and exports, package manifests, routing rules, build configuration, and nearby tests. Paths can be public interfaces, dynamic discovery patterns, or deployment inputs even when no typed import refers to them. Determine whether a generated file should be changed through its source or generator.

For a split or merge, trace the actual consumers. Check module-level side effects, shared mutable state, initialization order, and dependencies that cannot enter the same runtime. A split does not necessarily reduce a bundle, and a re-export does not necessarily prevent tree-shaking. Use the project's bundler configuration and output when performance motivates the change.

## Choose the boundary

| Question | Useful evidence |
|---|---|
| Extend or split? | Cohesion, independent consumers, ownership, runtime constraints, and the cost of understanding the affected task. |
| Move or keep? | The repository's domain map, existing imports, framework discovery, and supported paths. |
| Flat or nested? | Whether the directory gives a useful responsibility or navigation boundary, rather than reaching a file-count threshold. |
| Feature-local or shared? | Actual consumers and stable shared responsibility. Reuse alone does not require a generic global folder. |
| Direct imports or a barrel? | Public API stability, initialization behavior, dependency cycles, and measured build effects. |

Use history when it can resolve uncertainty about which responsibilities change together. Commit counts alone do not prove cohesion or independence.

## Preserve references and behavior

Search for old paths in typed imports, dynamic imports, mocks, configuration, scripts, documentation, test assertions, and deployment definitions. Inspect glob-based discovery as well as exact strings. For case-only renames, verify the change in Git and account for case-sensitive environments.

Preserve package exports, external import paths, and URLs where compatibility is required. A forwarding export or redirect may be appropriate during a supported migration. Keep intentional old references in migration documentation and compatibility tests; a zero-match search is not the goal.

For file-based routing, account for layouts, providers, error boundaries, and special files. Moving a page or removing a route group can change behavior even when its URL stays the same. Keep client-only and server-only dependencies in their permitted runtime.

Run the repository's relevant type, lint, and behavioral checks. Add a build or runtime check when bundling, initialization, dynamic loading, or routing is affected. Use dead-code tools as evidence to investigate; verify consumers before deleting files. Do not introduce a new toolchain or run every suite merely because a file moved.
