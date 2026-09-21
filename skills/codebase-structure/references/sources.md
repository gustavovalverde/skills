# Sources and scope

- [John Ousterhout: Designing Abstractions](https://web.stanford.edu/~ouster/CS349W/lectures/abstraction.html) supports information hiding and useful module interfaces. Module depth does not establish a preferred file count or directory depth.
- [Next.js: project structure](https://nextjs.org/docs/app/getting-started/project-structure) explains App Router conventions, colocation, private folders, and route groups. Apply these only to compatible Next.js projects; directory choices remain project-specific, and other routers differ.
- [webpack: tree shaking](https://webpack.js.org/guides/tree-shaking/) explains export usage and side-effect handling in webpack. Re-export behavior depends on the module graph and build configuration; it does not support a universal ban on barrels or a guarantee that splitting files reduces bundles.

Consult framework and build documentation for the project's installed version when those constraints determine the decision. These sources support conditional guidance, not universal filesystem rules. External works retain their own terms.
