# Security Policy

## Reporting a vulnerability

Please **do not** report security issues in public issues or pull requests.

Use GitHub's private vulnerability reporting instead:
[Report a vulnerability](https://github.com/sluhtie/mc-serverlist/security/advisories/new).

Include a description, steps to reproduce and the impact you expect. We aim to acknowledge reports
within a few days and will keep you updated until the issue is fixed. Credit is given in the
release notes unless you prefer otherwise.

## Supported versions

Only the latest version on the `main` branch receives security fixes.

## Scope notes

Areas that are especially sensitive:

- Outgoing connections to user-supplied hosts (status ping, Votifier), see
  `src/lib/minecraft/address.ts`
- Authentication and sessions, see `src/lib/auth/`
- Vote manipulation protections, see `src/server/actions/votes.ts`
