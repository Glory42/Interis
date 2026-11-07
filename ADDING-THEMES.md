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

Each block also sets the shadcn/library names (`--background`, `--card`, `--border`, `--module-movie`, …) from those roles, plus the navbar, hero, modal and typography (`--theme-body-font`, `--theme-display-font`, `--theme-kicker-font`) tokens. `--slate` (black) is set once in `:root` and shared by every theme.

`apps/web/tests/unit/features/theme/theme-registry.test.ts` reads `index.css` and checks that every text role (`--fg`, `--muted-foreground`, `--primary`, `--film`, `--series`, `--like`, `--danger`, `--warning`, `--success`) is a 6-digit hex that reaches 4.5:1 on `--bg` and `--surface`, and that `--primary-foreground` reaches 4.5:1 on `--primary`, for every id in its `THEME_IDS` list.

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

Add your theme ID to `SUPPORTED_THEME_IDS`:

```typescript
const SUPPORTED_THEME_IDS = ["rose-pine", "null-log", "nitrate", "marquee", "your-theme-id"] as const;
```

Making your theme the new default touches more than `DEFAULT_THEME_ID` here: the backend `DEFAULT_THEME_ID`, `window.__THIS_IS_CINEMA_DEFAULT_THEME_ID__` in `theme-registry.js`, the `"rose-pine"` fallbacks in the `index.html` startup script and `fallbackTheme` in this file, and the plain `:root` block in `index.css`, which holds the default palette.

If retiring an existing theme, add it to the `LEGACY_THEME_IDS` set.

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

Copy an existing block (e.g. `nitrate`), rename both selectors, and set every role:

```css
:root[data-theme-id="your-theme-id"], [data-theme-preview="your-theme-id"] {
```

The `[data-theme-preview]` selector is what lets the settings tile render in your theme's own colours, and the contrast test only finds blocks written in exactly this form. Light themes also set `color-scheme: light;`. Keep the derived library names in step with the roles (`--background: <bg>`, `--card: <surface>`, `--border: <line-strong over bg>`, `--module-movie: <film>`, `--module-serial: <series>`, …).

Optional signature touches go in the `@layer utilities` block as `:root[data-theme-id="your-theme-id"] .duotone` / `.slate` overrides (see null-log's scanlines and nitrate's sprocket edges).

If the theme names a font that isn't loaded yet, add its `@fontsource` package and import it in `apps/web/src/main.tsx`; `typography.test.ts` fails otherwise.

---

### Step 5: Frontend — update TypeScript type declaration

**File:** `apps/web/src/types/theme-registry.d.ts`

Update the `ThemeRegistryId` union type to include your theme:

```typescript
type ThemeRegistryId = "rose-pine" | "null-log" | "nitrate" | "marquee" | "your-theme-id";
```

---

### Step 6: Frontend — add the theme to the theme tests

**Files:** `apps/web/tests/unit/features/theme/theme-registry.test.ts` and `apps/web/tests/unit/features/settings/settings-theme.test.tsx`

Add your theme ID to `THEME_IDS` in both. The registry test asserts that `listThemes()` returns exactly this list, and it runs the contrast check only for ids in it; the settings test checks that every theme gets a tile.

The settings tiles (`SettingsThemeSection.tsx`) and the profile menu's theme submenu (`NavbarThemeSubmenu.tsx`) render from `listThemes()`, so neither needs editing.

---

### Step 7: Verify and test

Run the full quality check suite:

```bash
# Backend
cd apps/api
bun run typecheck

# Frontend
cd apps/web
bun run typecheck
bun run lint
bun run test
bun run build
```

Then test manually:

1. Start both backend and frontend
2. Log in to an account
3. Go to Settings → Theme (`/settings/theme`)
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
| 4 | `apps/web/src/index.css` | Add a `:root[data-theme-id="..."], [data-theme-preview="..."]` block with every colour role |
| 5 | `apps/web/src/types/theme-registry.d.ts` | Add to `ThemeRegistryId` union |
| 6 | `apps/web/tests/unit/features/theme/theme-registry.test.ts` | Add to `THEME_IDS` |
| 6b | `apps/web/tests/unit/features/settings/settings-theme.test.tsx` | Add to `THEME_IDS` |
| 7 | `apps/web/src/main.tsx` (only for a new font) | Import its `@fontsource` package |

---

## Retiring a theme

To retire an existing theme without breaking users who have it saved:

1. **Backend**: Move the theme ID from `SUPPORTED_THEME_IDS` to `LEGACY_THEME_IDS` in `theme.constants.ts`
2. **Frontend**: Move the theme ID from `SUPPORTED_THEME_IDS` to `LEGACY_THEME_IDS` in `theme-registry.ts`
3. **Frontend**: Remove its entry from `theme-registry.js`, its `index.css` block and its id from `ThemeRegistryId` and both tests' `THEME_IDS` (`theme-registry.js` has no legacy list; an unknown `data-theme-id` falls through to `:root`, the default palette)
4. Users with the retired theme saved will be silently redirected to the default theme
5. The theme will no longer appear in the settings picker

To **replace** a theme instead (as Nitrate replaced Tokyo Night), map the old id to the
new one in `RENAMED_THEME_IDS` (backend `theme.constants.ts` and frontend
`theme-registry.ts`) and in `renamedThemeIds` in the `index.html` startup script, then add a
data migration that rewrites `profile.theme` (see `apps/api/drizzle/0061_nitrate_theme.sql`).

---

## No database migration needed

The `theme` column in the `profile` table is stored as `text`, not as a PostgreSQL enum. This means adding or removing themes requires **no database migration**. The backend validates theme IDs at the application layer using the `normalizeThemeId()` function and the `SUPPORTED_THEME_IDS` whitelist.
