---
name: add-theme
description: Add a new visual theme to Interis end-to-end — backend whitelist, frontend registry, CSS tokens, TypeScript types, and settings UI. Use when the user says "add a theme", "create a new theme", "/add-theme", or asks to implement a specific colour scheme.
---

# Add Theme — Interis

Walks through all 6 required files when adding a new theme. Read `ADDING-THEMES.md` in the project root first — it is the canonical reference with the full token list and design tips. This skill is the execution checklist; ADDING-THEMES.md is the specification.

## Before starting

Confirm the theme ID with the user if not already provided. Rules:
- Lowercase alphanumeric + hyphens only: `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`
- Max 64 characters, no spaces, no uppercase
- Must be unique (grep existing themes in `theme.constants.ts`)

Also confirm: is this a dark theme, light theme, or does it support both?

---

## Step 1 — Backend whitelist

**File:** `apps/api/src/modules/users/constants/theme.constants.ts`

Add the new theme ID to `SUPPORTED_THEME_IDS`. Alphabetical order within the array is preferred but not enforced.

Verify the existing themes first with a quick Read so you don't accidentally duplicate an ID.

---

## Step 2 — Frontend theme ID whitelist

**File:** `apps/web/src/features/theme/theme-registry.ts`

Add the same theme ID to `SUPPORTED_THEME_IDS` (the `as const` array near the top of the file, around line 16).

Both whitelists (backend and frontend) must be in sync — a theme ID present in one but not the other will either be rejected on save or invisible in the picker.

---

## Step 3 — Registry data file

**File:** `apps/web/public/theme-registry.js`

This is a plain JS file loaded as a `<script>` before React hydrates. It populates `window.__THIS_IS_CINEMA_THEME_REGISTRY__`.

Add a new entry to the registry object. Required shape:

```js
"your-theme-id": {
  id: "your-theme-id",
  label: "Human Readable Name",
  description: "One sentence describing the vibe.",
  preview: {
    background: "#...",
    foreground: "#...",
    primary: "#...",
    secondary: "#...",
    accent: "#...",
    muted: "#...",
  },
  tokens: {
    "--background": "#...",
    "--foreground": "#...",
    "--primary": "#...",
    // ... all required tokens (see ADDING-THEMES.md for the full list)
  },
}
```

The `preview` object drives the swatch shown in the settings picker — use the most representative colours.

If the user has provided a colour palette, generate all token values from it. If not, ask the user for at minimum: background, foreground, primary accent, and secondary accent colours, then derive the remaining tokens from those.

---

## Step 4 — CSS token block

**File:** `apps/web/src/index.css`

Add a `:root[data-theme-id="your-theme-id"]` block with all CSS custom properties. This is the runtime token source; `theme-registry.js` tokens are applied via JS on boot, but the CSS block acts as the fallback and SSR baseline.

Copy the structure from an existing theme block in the file as a template. The full token list is in `ADDING-THEMES.md` — every group (core, aura, shell, hero, modal, navbar, UI elements, typography, button effects, radius, module colors) must be present.

---

## Step 5 — TypeScript type

**File:** `apps/web/src/types/theme-registry.d.ts`

Add the theme ID to the `ThemeRegistryId` union type:

```typescript
type ThemeRegistryId = "rose-pine" | "null-log" | "tokyo-night" | "amoled" | "your-theme-id";
```

Missing this causes type errors wherever `ThemeRegistryId` is used as a narrowed string type.

---

## Step 6 — Settings page description

**File:** `apps/web/src/features/settings/components/sections/SettingsThemeSection.tsx`

Update the `CardDescription` text to include the new theme's name in the list of selectable themes (around line 72). Keep the sentence style consistent with existing entries.

---

## Verification

After all 6 files are edited, run:

```bash
# From apps/api/
bun run typecheck

# From apps/web/
bun run typecheck
bun run lint
```

Fix any type errors before reporting done.

Then manually verify by running both servers (`bun run dev` in `apps/api/` and `apps/web/`) and:
1. Log in
2. Go to Settings → Appearance
3. Select the new theme — it should appear in the picker
4. Confirm it applies immediately with no flash
5. Reload — theme should persist
6. Check navbar, modals, and card backgrounds all use the new colours

## Retiring a theme

If the user wants to remove an existing theme instead of adding one:

1. `theme.constants.ts` — move ID from `SUPPORTED_THEME_IDS` to `LEGACY_THEME_IDS`
2. `theme-registry.ts` — same move
3. `theme-registry.js` — add ID to `LEGACY_THEME_IDS` array if present
4. Leave the CSS block and registry entry in place (retiring just hides it from the picker; it doesn't break users who have it saved — they silently fall back to the default)
5. No DB migration needed — `themeId` is stored as plain `text`, not a PG enum
