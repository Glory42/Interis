---
title: Future Notes
description: Current public API boundaries and practical next improvements.
---

This page documents likely next areas without treating them as shipped features.

## Current boundaries

- Public routes are read-only and username-based.
- No auth token system for public endpoints.
- No cursor pagination yet.
- Public responses are `no-store`.

## Potential near-term improvements

- Cursor or offset pagination for high-volume users.
- More explicit endpoint-specific response schemas in backend DTOs.
- Additional response metadata for easier widget hydration.
- Public docs changelog entries tied to backend releases.

## Guardrail

Until features are implemented in backend routes/services, they are not documented
as available API capabilities in endpoint reference pages.
