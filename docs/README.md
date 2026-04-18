# Interis Docs

Astro + Starlight documentation site for the Interis public API.

Public API base (production):

- `https://api.interis.gorkemkaryol.dev/api/public`

Intended deployment target:

- `https://docs.interis.gorkemkaryol.dev`

## Local development

```bash
cd docs
bun install
bun run dev
```

## Build

```bash
cd docs
bun run build
```

## Content structure

- `src/content/docs/index.md` -> Getting Started homepage
- `src/content/docs/api/` -> API overview + endpoint reference
- `src/content/docs/examples/` -> practical usage examples
- `src/content/docs/reference/` -> shared behavior notes (shapes, errors, limits, FAQ)
