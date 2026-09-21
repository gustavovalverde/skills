# Sources and scope

Use these sources to investigate a caller's difficulty or support attribution. Their examples and conventions are contextual; they do not mandate one API shape or require fetching sources during routine work.

- [Steven Clarke: Describing and Measuring API Usability with the Cognitive Dimensions](https://www.cl.cam.ac.uk/~afb21/CognitiveDimensions/workshop2005/Clarke_position_paper.pdf) describes an API usability study in which developers could not relate low-level classes to their tasks. It motivates evaluating abstraction level, discovery, premature commitment, and change effort against the intended users. This position paper is not a universal scoring system; its observed task timings do not predict another API's usability.
- [John Ousterhout: Designing Abstractions](https://web.stanford.edu/~ouster/CS349W/lectures/abstraction.html) argues for simple interfaces that hide substantial implementation complexity and let users learn special cases after the common case. These lecture notes support reasoning about caller burden, not a fixed quota for methods or entrypoints.
- [Microsoft: Azure SDK Language Design Guidelines for Python](https://learn.microsoft.com/en-us/azure/developer/python/sdk/fundamentals/language-design-guidelines) discusses idiomatic usage, consistency, simplicity, and progressive disclosure. Use the general design questions across projects; Azure and Python conventions are not requirements for unrelated APIs.
- [Google: AIP-100, API Design Review FAQ](https://google.aip.dev/100) frames review around the user's understanding of the API and encourages early design feedback. Its review process and other Google API rules apply in their own context, not automatically to every library or protocol.

Practical questions adapted from these sources: can callers recognize the task in the surface, make necessary choices with the information they have, inspect partial progress, diagnose failures, and add advanced control without rebuilding the common path? Evaluate these against actual usage rather than counting concepts in isolation.

External works retain their own licenses and terms. These references summarize applicable ideas rather than reproduce the source material.
