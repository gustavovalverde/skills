# Decision examples

## One implementation can justify an interface

An invoice service uses a `TaxRates` interface backed by one HTTP provider. Tests supply rates without network access, and callers depend on a domain result rather than the provider's response format.

Retain the boundary: it serves current isolation and testing needs. Another production implementation is unnecessary to justify it. Investigate instead whether provider errors and rate freshness are represented accurately.

If an interface merely duplicates a private class's methods and has no consumer, ownership, or testing benefit, removing it may reduce maintenance. The decision depends on what the boundary does.

## A conditional can be the clearest extension mechanism

A formatter supports two fixed export formats. Each branch calls a serializer, and adding a supported format changes one exhaustive selection and its tests.

Keep the local selection unless actual requirements call for independent registration or loading. A plugin registry adds configuration, discovery, and failure modes. A switch is not itself an open–closed defect.

## Similar calculations can express different policies

Shipping and warranty code both multiply a subtotal by a percentage. They have different owners, rounding rules, and change schedules.

Keep the policies separate despite similar arithmetic. Share a money primitive only if its rounding and representation contract genuinely applies to both. A shared function with policy flags can make independent changes harder.

## Simplifying an error path can change its meaning

A proposed repository helper catches every storage error and returns `null`. Its caller treats `null` as a missing record and creates one.

Reject that translation if outages are among the caught errors: unavailable storage is not evidence that a record is absent. Preserve the distinct failure, and exercise both the not-found and unavailable paths. Shorter code would otherwise change the caller's decision.

## Fewer modules do not imply one transaction

An account workflow writes a record and sends a welcome email. Combining these calls in one service can simplify the caller, but cannot make the database and mail provider commit atomically.

Specify what success means and what happens if email delivery fails after the record is saved. Retain the existing failure contract during a structural refactor. If durable delivery is required, assess an appropriate delivery mechanism separately rather than silently adding retries or promising atomicity.

## Design one complete operation before a framework

A new report feature must let an administrator request an export and later download it. First sketch the request and observable pending, completed, and failed outcomes. Then decide who owns authorization, job state, file retention, and failures after scheduling. Use those decisions to place the behavior within existing modules and choose names that match the product.

A first slice can connect one supported report request to a retrievable result with authorization and failure handling. A generic workflow engine or registry requires evidence that the current task benefits from it. Keep uncertain capacity requirements visible rather than inventing guarantees. If the task is only an assessment, propose the slice without implementing it.
