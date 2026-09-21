# Decision examples

## Similar filenames can protect different runtimes

`report-format.ts` contains pure formatting used in the browser and server. `report-export.ts` imports a server-only storage client. One server caller imports both.

Keep the runtime boundary. A common prefix and a shared caller do not justify merging code that browser consumers must not load. If placement is confusing, clarify names or exports while retaining the boundary; verify the browser dependency graph when changing it.

## A small directory can have a real purpose

A route group contains one page and a layout that installs a provider. Removing the group would move the page under a different layout.

Retain the group unless changing the provider or layout is intended. Child count is not evidence that the directory is redundant. Likewise, an adapter directory can isolate generated bindings or packaging rules before it grows beyond one file.

## A barrel can be a compatibility boundary

A package exposes `package-name` through an index that re-exports supported functions. Internal files are not supported import paths.

Keep the public entrypoint. If consumers report bundle growth, inspect side effects and actual bundler output before replacing imports. Exposing private paths can exchange a build concern for a compatibility problem without reducing the bundle.

## A new responsibility need not have commit history

An upload feature introduces a pure parser and a worker that owns file access and background processing. No history exists for either.

Separate them if the runtime and consumer requirements justify it. The parser can have independent callers without inheriting the worker's environment. Document the boundary directly rather than inventing evidence of different change rates.
