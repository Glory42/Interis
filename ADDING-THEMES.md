# Adding a New Theme

This guide walks through every change required to add a new theme to Interis. The theme system spans the backend (validation + storage), the frontend (registry + CSS tokens + UI), and requires coordinated updates across multiple files.

## How the theme system works

### Architecture overview

```
User selects theme in Settings
         |
         v
Frontend applies CSS tokens immediately (optimistic update)
         |
         v
PUT /api/users/me/theme  ->  Backend validates themeId
         |                        |
         v                        v
Frontend persists to localStorage   Backend updates profile.themeId in DB
         |                        |
         v                        v
On next page load: bootstrapStoredTheme() reads localStorage, resolves against registry, applies tokens
```

### Key concepts

- **Theme ID**: A kebab-case string (e.g., `rose-pine`, `null-log`, `gruvbox`) that identifies a theme.
- **Theme registry**: A JavaScript object (`window.__THIS_IS_CINEMA_THEME_REGISTRY__`) that maps theme IDs to their full definitions (label, description, preview swatches, CSS tokens). Loaded from `public/theme-registry.js` before React hydrates to prevent flash of unstyled content.
- **CSS tokens**: Custom properties (e.g., `--background`, `--primary`, `--theme-shell-gradient`) applied to `:root` via `document.documentElement.style.setProperty()`.
- **Supported themes**: A whitelist on both backend and frontend. Only themes in both lists are selectable.
- **Legacy themes**: Retired theme IDs that get silently mapped to the default theme. This prevents users with old saved themes from breaking.

### Token categories

Every theme must define these token groups:

| Group | Purpose |
| --- | --- |
| **Core colors** | `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--border`, `--input`, `--ring`, `--destructive` |
| **Aura tokens** | `--aura-primary`, `--aura-secondary`, `--aura-muted` (used for glow effects, badges, highlights) |
| **Shell decorations** | `--theme-shell-gradient`, `--theme-shell-pattern`, `--theme-shell-pattern-size`, `--theme-shell-pattern-position`, `--theme-shell-pattern-opacity`, `--theme-shell-vignette`, `--theme-shell-vignette-opacity` |
| **Hero decorations** | `--theme-hero-gradient`, `--theme-hero-gradient-opacity`, `--theme-hero-pattern`, `--theme-hero-pattern-size`, `--theme-hero-pattern-position`, `--theme-hero-pattern-opacity` |
| **Modal decorations** | `--theme-modal-overlay`, `--theme-modal-gradient`, `--theme-modal-pattern`, `--theme-modal-pattern-size`, `--theme-modal-pattern-position`, `--theme-modal-pattern-opacity`, `--theme-modal-border`, `--theme-modal-shadow` |
| **Navbar** | `--theme-navbar-bg`, `--theme-navbar-border`, `--theme-navbar-shadow`, `--theme-navbar-overlay` |
| **UI elements** | `--theme-pill-bg`, `--theme-pill-border`, `--theme-pill-text`, `--theme-pill-shadow`, `--theme-segment-bg`, `--theme-segment-border` |
| **Typography** | `--theme-body-font`, `--theme-display-font`, `--theme-display-letter-spacing`, `--theme-display-shadow`, `--theme-kicker-font`, `--theme-kicker-tracking`, `--theme-kicker-weight` |
| **Button effects** | `--theme-button-primary-shadow`, `--theme-button-primary-shadow-hover`, `--theme-button-danger-shadow`, `--theme-button-danger-shadow-hover` |
| **Radius** | `--radius` (base border radius, used to calculate sm/md/lg/xl/2xl/3xl/4xl) |
| **Module colors** | `--module-cinema`, `--module-serial`, `--module-neutral` |

---

## Step-by-step guide

### Step 1: Backend — register the theme ID

**File:** `backend/src/modules/users/constants/theme.constants.ts`

Add your theme ID to `SUPPORTED_THEME_IDS`:

```typescript
export const SUPPORTED_THEME_IDS = [
  "rose-pine",
  "null-log",
  "gruvbox",
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

**File:** `frontend/src/features/theme/theme-registry.ts`

Add your theme ID to `SUPPORTED_THEME_IDS` (line 16):

```typescript
const SUPPORTED_THEME_IDS = ["rose-pine", "null-log", "gruvbox", "your-theme-id"] as const;
```

Also update `DEFAULT_THEME_ID` (line 14) if you want your theme to be the new default.

If retiring an existing theme, add it to the `LEGACY_THEME_IDS` set (lines 24-47).

---

### Step 3: Frontend — add theme to the registry data file

**File:** `frontend/public/theme-registry.js`

This file is loaded as a plain `<script>` tag before React hydrates. It populates `window.__THIS_IS_CINEMA_THEME_REGISTRY__`. Add your theme definition:

```javascript
window.__THIS_IS_CINEMA_THEME_REGISTRY__ = {
  // ... existing themes ...

  "your-theme-id": {
    id: "your-theme-id",
    label: "Your Theme Name",
    description: "A brief description of the theme's aesthetic.",
    preview: {
      mode: "dark",  // or "light"
      swatches: ["#bg-hex", "#card-hex", "#primary-hex", "#accent-hex"],
    },
    tokens: {
      // Core colors (required)
      "--background": "#...",
      "--foreground": "#...",
      "--card": "#...",
      "--card-foreground": "#...",
      "--popover": "#...",
      "--popover-foreground": "#...",
      "--primary": "#...",
      "--primary-foreground": "#...",
      "--secondary": "#...",
      "--secondary-foreground": "#...",
      "--muted": "#...",
      "--muted-foreground": "#...",
      "--accent": "#...",
      "--accent-foreground": "#...",
      "--border": "#...",
      "--input": "#...",
      "--ring": "#...",
      "--destructive": "#...",

      // Aura tokens (required)
      "--aura-primary": "#...",
      "--aura-secondary": "#...",
      "--aura-muted": "#...",
    },
  },
};
```

**Important:** Only the core colors and aura tokens go here. The shell/hero/modal/navbar/pill/segment/button tokens are defined in `index.css` (Step 4). The registry tokens are applied directly via JavaScript at boot time for FOUC prevention.

If you want this theme to be the default, also update the last line:

```javascript
window.__THIS_IS_CINEMA_DEFAULT_THEME_ID__ = "your-theme-id";
```

---

### Step 4: Frontend — add full CSS token overrides

**File:** `frontend/src/index.css`

Add a `:root[data-theme-id="your-theme-id"]` block with ALL tokens. Use an existing theme block (e.g., `:root[data-theme-id="gruvbox"]` starting at line 300) as a template.

You must define every token that appears in the `:root` default block. Tokens not overridden will inherit from `:root`.

```css
:root[data-theme-id="your-theme-id"] {
  --radius: 0.5rem;  /* adjust for roundedness preference */

  /* Core colors */
  --background: #...;
  --foreground: #...;
  --card: #...;
  --card-foreground: #...;
  --popover: #...;
  --popover-foreground: #...;
  --primary: #...;
  --primary-foreground: #...;
  --secondary: #...;
  --secondary-foreground: #...;
  --muted: #...;
  --muted-foreground: #...;
  --accent: #...;
  --accent-foreground: #...;
  --border: #...;
  --input: #...;
  --ring: #...;
  --destructive: #...;

  /* Aura tokens */
  --aura-primary: #...;
  --aura-secondary: #...;
  --aura-muted: #...;

  /* Shell decorations */
  --theme-shell-gradient: ...;
  --theme-shell-pattern: ...;
  --theme-shell-pattern-size: auto;
  --theme-shell-pattern-position: center;
  --theme-shell-pattern-opacity: ...;
  --theme-shell-vignette: ...;
  --theme-shell-vignette-opacity: ...;

  /* Hero decorations */
  --theme-hero-gradient: ...;
  --theme-hero-gradient-opacity: 1;
  --theme-hero-pattern: none;
  --theme-hero-pattern-size: auto;
  --theme-hero-pattern-position: center;
  --theme-hero-pattern-opacity: 0;

  /* Modal decorations */
  --theme-modal-overlay: rgba(...);
  --theme-modal-gradient: ...;
  --theme-modal-pattern: none;
  --theme-modal-pattern-size: auto;
  --theme-modal-pattern-position: center;
  --theme-modal-pattern-opacity: 0;
  --theme-modal-border: rgba(...);
  --theme-modal-shadow: ...;

  /* Navbar */
  --theme-navbar-bg: rgba(...);
  --theme-navbar-border: rgba(...);
  --theme-navbar-shadow: ...;
  --theme-navbar-overlay: rgba(...);

  /* UI elements */
  --theme-pill-bg: rgba(...);
  --theme-pill-border: rgba(...);
  --theme-pill-text: #...;
  --theme-pill-shadow: ...;
  --theme-segment-bg: rgba(...);
  --theme-segment-border: rgba(...);

  /* Typography */
  --theme-body-font: "...", "...", sans-serif;
  --theme-display-font: "...", "...", sans-serif;
  --theme-display-letter-spacing: -0.02em;
  --theme-display-shadow: none;
  --theme-kicker-font: "...", monospace;
  --theme-kicker-tracking: 0.18em;
  --theme-kicker-weight: 700;

  /* Button effects */
  --theme-button-primary-shadow: ...;
  --theme-button-primary-shadow-hover: ...;
  --theme-button-danger-shadow: ...;
  --theme-button-danger-shadow-hover: ...;

  /* Module colors */
  --module-cinema: #...;
  --module-serial: #...;
  --module-neutral: #...;
}
```

**Tips for designing tokens:**

- **Core colors** should have sufficient contrast (WCAG AA minimum). Use tools like [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/).
- **`--primary`** is the main accent color used for links, active states, and highlights.
- **`--destructive`** is used for error states and danger actions.
- **`--aura-*`** tokens drive glow effects, badge backgrounds, and subtle highlights.
- **Shell/hero/modal gradients** create the atmospheric background layers. Use radial gradients with low opacity for subtle effects.
- **`--theme-navbar-bg`** should be semi-transparent (use `rgba`) for the blur effect.
- **Typography**: You can change the entire font personality — monospace for terminal vibes, serif for elegance, etc.

---

### Step 5: Frontend — update TypeScript type declaration

**File:** `frontend/src/types/theme-registry.d.ts`

Update the `ThemeRegistryId` union type to include your theme:

```typescript
type ThemeRegistryId = "rose-pine" | "null-log" | "gruvbox" | "your-theme-id";
```

---

### Step 6: Frontend — update the settings page description

**File:** `frontend/src/features/settings/components/sections/SettingsThemeSection.tsx`

Update the `CardDescription` text (around line 72) to include your theme name in the list:

```tsx
<CardDescription>
  Choose between Rose Pine, NULL://LOG, Gruvbox, and Your Theme Name. Selection applies immediately and syncs to your account.
</CardDescription>
```

---

### Step 7: Verify and test

Run the full quality check suite:

```bash
# Backend
cd backend
bunx tsc --noEmit

# Frontend
cd frontend
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
| 1 | `backend/src/modules/users/constants/theme.constants.ts` | Add to `SUPPORTED_THEME_IDS` |
| 2 | `frontend/src/features/theme/theme-registry.ts` | Add to `SUPPORTED_THEME_IDS` |
| 3 | `frontend/public/theme-registry.js` | Add full theme definition (core + aura tokens) |
| 4 | `frontend/src/index.css` | Add `:root[data-theme-id="..."]` block with all tokens |
| 5 | `frontend/src/types/theme-registry.d.ts` | Add to `ThemeRegistryId` union |
| 6 | `frontend/src/features/settings/components/sections/SettingsThemeSection.tsx` | Update description text |

---

## Retiring a theme

To retire an existing theme without breaking users who have it saved:

1. **Backend**: Move the theme ID from `SUPPORTED_THEME_IDS` to `LEGACY_THEME_IDS` in `theme.constants.ts`
2. **Frontend**: Move the theme ID from `SUPPORTED_THEME_IDS` to `LEGACY_THEME_IDS` in `theme-registry.ts`
3. **Frontend**: Add the theme ID to `LEGACY_THEME_IDS` in `theme-registry.js` (if present)
4. Users with the retired theme saved will be silently redirected to the default theme
5. The theme will no longer appear in the settings picker

---

## No database migration needed

The `theme` column in the `profile` table is stored as `text`, not as a PostgreSQL enum. This means adding or removing themes requires **no database migration**. The backend validates theme IDs at the application layer using the `normalizeThemeId()` function and the `SUPPORTED_THEME_IDS` whitelist.
