# Decision examples

## A captured request overrules the documentation

A team is deciding whether its user-provisioning endpoint must accept a create request for a user who already exists but is deactivated. A provider's documentation describes only a lookup followed by an update, so the tempting conclusion is that duplicate creates never happen.

The provider's published sample requests and a reporter's logs both show a create request for the deactivated user. The captured request outranks the documentation, so the endpoint must handle it. Record the documentation as "docs only" and the capture as the evidence for the hinge claim.

## Specification text outranks loose consensus

Several open-source authorization servers accept a redirect URI that differs from the registered one by a trailing slash or a port. The tempting choice is to match that leniency, since it reduces support requests.

The OAuth security best current practice requires exact string matching of redirect URIs, with one exception: a loopback redirect URI for a native app may use any port. Copy the exception, reject the wider leniency, and record both decisions with the specification sections as their source. Consensus shows what others do; it does not show that their choice is safe.

## A popular default without recorded intent is weak evidence

A widely used library sets a 30-second request timeout, and the tempting choice is to copy it as the new default. Its source sets the value, but no issue, changelog entry, or comment says why.

Treat the value as consensus-level evidence at most. Look for implementations that explain their default, and for the operation's actual latency in this project. If no reasoned precedent exists, choose from the project's own measurements and record that no precedent was found.
