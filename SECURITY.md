# Security Policy

## Supported versions

Interis is deployed continuously from `master`. Only the live site
([interis.gorkemkaryol.dev](https://interis.gorkemkaryol.dev)), its API
(`api.interis.gorkemkaryol.dev`) and the latest commit on `master` receive
security fixes. Forks and older commits are not supported.

## Reporting a vulnerability

**Please do not open a public issue, pull request or discussion for security
problems.**

Report privately through one of these channels:

1. **GitHub private vulnerability reporting** — go to the
   [Security tab](https://github.com/Glory42/Interis/security) and click
   **Report a vulnerability**.
2. **Email** — [me@gorkemkaryol.dev](mailto:me@gorkemkaryol.dev) with the
   subject line `[Interis security]`.

Please include:

- The affected area (web app, API endpoint, public API, auth, uploads, …)
- Steps to reproduce, or a proof of concept
- The impact you believe it has (data exposure, account takeover, etc.)
- Any suggested fix, if you have one

## What to expect

Interis is a side project maintained by one person, so these are best-effort
targets rather than guarantees:

- **Acknowledgement** within 3 days
- **Initial assessment** within 7 days
- **Fix or mitigation** as soon as practical, prioritised by severity

You will be kept informed while the issue is investigated and fixed. With your
permission, you will be credited in the fix commit or advisory once it is
resolved.

## Scope

In scope:

- The Interis web app and API, including auth (JWT access and refresh
  cookies), account management, uploads to R2, and the public API
  (`/api/public/*`)
- Code in this repository

Out of scope:

- Third-party services Interis depends on (TMDB, Neon, Render, Cloudflare) —
  report those to the vendor directly
- Denial-of-service, load or volumetric testing against the live site
- Social engineering, phishing or physical attacks
- Reports from automated scanners with no demonstrated impact
- Missing best-practice headers or settings with no practical exploit

## Testing guidelines

When researching a vulnerability:

- Use your own accounts only; never access or modify other users' data
- Prefer a local setup (`docker compose up`) over testing against production
- Do not run automated scanners or crawlers against the live site — it runs on
  free-tier infrastructure with tight compute and transfer quotas
- Stop and report as soon as you have confirmed an issue

Good-faith research that follows this policy is welcome, and will not be
pursued.
