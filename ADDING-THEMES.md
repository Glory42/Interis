# Adding a New Theme

This guide walks through every change required to add a new theme to Interis. The theme system spans the backend (validation + storage), the frontend (registry + CSS tokens + UI), and requires coordinated updates across multiple files.

## How the theme system works

### Architecture overview

```
User selects theme in Settings
         |
         v
Frontend sets <html data-theme-id="…"> (optimistic update)
         |
         v
PUT /api/users/me/theme  ->  Backend validates themeId and stores profile.theme
         |
         v
Frontend persists the id to localStorage; on the next load the startup
script in index.html sets data-theme-id before React renders
```

### Key concepts

- **Theme ID**: A kebab-case string (e.g., `rose-pine`, `null-log`, `nitrate`) that identifies a theme.
- **Colours live in one place**: `src/index.css`. `:root` holds Rose Pine (the default) and every other theme is a `:root[data-theme-id="…"]` block. Nothing sets colours inline.
- **Theme registry**: `public/theme-registry.js` defines `window.__THIS_IS_CINEMA_THEME_REGISTRY__` with each theme's id, label, description and preview swatches for the picker. It holds no colour tokens.
- **Supported themes**: A whitelist on both backend and frontend. Only themes in both lists are selectable.
- **Legacy and renamed themes**: retired ids map to the default theme; renamed ids (`RENAMED_THEME_IDS`) map to their successor.

### Colour roles

Every theme block defines the same roles. Components should use these.

| Role | Meaning |
| --- | --- |
| `--bg`, `--surface`, `--raised` | page, cards and panels, popovers and inputs |
| `--fg`, `--muted-foreground`, `--faint` | body text, secondary text, decorative only (not for text) |
| `--line`, `--line-strong` | hairlines and stronger borders |
| `--primary`, `--primary-foreground` | the action colour and text on it |
| `--film`, `--series` | film and TV identity |
| `--like`, `--danger`, `--warning`, `--success` | states |
| `--grain` | grain opacity for backdrops |

Each block also sets the shadcn/library names (`--background`, `--card`, `--border`, `--module-movie`, …) from those roles, plus the navbar, hero, modal and typography tokens.

`tests/unit/features/theme/theme-registry.test.ts` reads `index.css` and checks that every text role reaches 4.5:1 on `--bg` and `--surface` in every theme.

---

## Step-by-step guide

### Step 1: Backend — register the theme ID

**File:** `apps/api/src/modules/users/constants/theme.constants.ts`

Add your theme ID to `SUPPORTED_THEME_IDS`:

```typescript
export const SUPPORTED_THEME_IDS = [
  "rose-pine",
  "null-log",
  "nitrate",
  "marquee",
  "your-theme-id",  // <-- add here
] as const;
```

**Rules for theme IDs:**
- Must match pattern `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` (lowercase alphanumeric with hyphens)
- Max 64 characters
- No spaces, no uppercase, no special characters except hyphens

If you are retiring an existing theme, move it from `SUPPORTED_THEME_IDS` to the `LEGACY_THEME_IDS` set.

---

### Step 2: Frontend — register the theme ID

**File:** `apps/web/src/features/theme/theme-registry.ts`

Add your theme ID to `SUPPORTED_THEME_IDS` (line 16):

```typescript
const SUPPORTED_THEME_IDS = ["rose-pine", "null-log", "nitrate", "marquee", "your-theme-id"] as const;
```

Also update `DEFAULT_THEME_ID` (line 14) if you want your theme to be the new default.

If retiring an existing theme, add it to the `LEGACY_THEME_IDS` set (lines 24-47).

---

### Step 3: Frontend — add theme to the registry data file

**File:** `apps/web/public/theme-registry.js`

Add the picker metadata only:

```javascript
  "your-theme-id": {
    id: "your-theme-id",
    label: "Your Theme Name",
    description: "One line on the palette and what each colour means.",
    preview: {
      mode: "dark", // or "light"
      swatches: ["#bg", "#surface", "#primary", "#film"],
    },
  },
```

---

### Step 4: Frontend — add the CSS block

**File:** `apps/web/src/index.css`

Copy an existing `:root[data-theme-id="…"]` block (e.g. `nitrate`), rename it, and set every role. Light themes also set `color-scheme: light;`. Keep the derived library names in step with the roles (`--background: <bg>`, `--card: <surface>`, `--border: <line-strong over bg>`, `--module-movie: <film>`, `--module-serial: <series>`, …).

Run `bun run test` from `apps/web`; the contrast test fails if a text role is too faint.

---

### Step 5: Frontend — update TypeScript type declaration

**File:** `apps/web/src/types/theme-registry.d.ts`

Update the `ThemeRegistryId` union type to include your theme:

```typescript
type ThemeRegistryId = "rose-pine" | "null-log" | "nitrate" | "marquee" | "your-theme-id";
```

---

### Step 6: Frontend — update the settings page description

**File:** `apps/web/src/features/settings/components/sections/SettingsThemeSection.tsx`

Update the `CardDescription` text (around line 72) to include your theme name in the list:

```tsx
<CardDescription>
  Choose between Rose Pine, NULL://LOG, Nitrate, Marquee, and Your Theme Name. Selection applies immediately and syncs to your account.
</CardDescription>
```

---

### Step 7: Verify and test

Run the full quality check suite:

```bash
# Backend
cd apps/api
bunx tsc --noEmit

# Frontend
cd apps/web
bun run typecheck
bun run lint
bun run build
```

Then test manually:

1. Start both backend and frontend
2. Log in to an account
3. Go to Settings > Appearance
4. Select your new theme
5. Verify:
   - Theme applies immediately (no flash)
   - All UI elements render correctly
   - Text is readable on all backgrounds
   - Gradients and patterns look intentional
   - Navbar, modals, pills, and buttons use theme colors
   - Theme persists after page reload
   - Theme syncs correctly when logging in from a different browser

---

## File checklist

Every file that needs modification when adding a theme:

| # | File | Change |
| --- | --- | --- |
| 1 | `apps/api/src/modules/users/constants/theme.constants.ts` | Add to `SUPPORTED_THEME_IDS` |
| 2 | `apps/web/src/features/theme/theme-registry.ts` | Add to `SUPPORTED_THEME_IDS` |
| 3 | `apps/web/public/theme-registry.js` | Add id, label, description and preview swatches |
| 4 | `apps/web/src/index.css` | Add a `:root[data-theme-id="..."]` block with every colour role |
| 5 | `apps/web/src/types/theme-registry.d.ts` | Add to `ThemeRegistryId` union |
| 6 | `apps/web/src/features/settings/components/sections/SettingsThemeSection.tsx` | Update description text |

---

## Retiring a theme

To retire an existing theme without breaking users who have it saved:

1. **Backend**: Move the theme ID from `SUPPORTED_THEME_IDS` to `LEGACY_THEME_IDS` in `theme.constants.ts`
2. **Frontend**: Move the theme ID from `SUPPORTED_THEME_IDS` to `LEGACY_THEME_IDS` in `theme-registry.ts`
3. **Frontend**: Add the theme ID to `LEGACY_THEME_IDS` in `theme-registry.js` (if present)
4. Users with the retired theme saved will be silently redirected to the default theme
5. The theme will no longer appear in the settings picker

To **replace** a theme instead (as Nitrate replaced Tokyo Night), map the old id to the
new one in `RENAMED_THEME_IDS` (backend `theme.constants.ts` and frontend
`theme-registry.ts`) and in `renamedThemeIds` in the `index.html` startup script, then add a
data migration that rewrites `profile.theme` (see `drizzle/0061_nitrate_theme.sql`).

---

## No database migration needed

The `theme` column in the `profile` table is stored as `text`, not as a PostgreSQL enum. This means adding or removing themes requires **no database migration**. The backend validates theme IDs at the application layer using the `normalizeThemeId()` function and the `SUPPORTED_THEME_IDS` whitelist.
