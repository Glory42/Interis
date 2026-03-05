frontend/
├── components.json           # shadcn/ui configuration file
├── package.json
├── vite.config.ts            # Vite config (contains your /api proxy to Express)
├── tsconfig.json             # TypeScript root config
├── tsconfig.app.json         # Contains your "@/*" path aliases
└── src/
    ├── main.tsx              # React entry point & TanStack Query Provider
    ├── App.tsx               # Defines the react-router-dom <Routes>
    ├── index.css             # Just one line: @import "tailwindcss";
    │
    ├── lib/                  # Helpers and external connections
    │   ├── api.ts            # TanStack Query custom hooks (e.g., useSearchMovies)
    │   ├── auth-client.ts    # Better Auth's frontend client setup
    │   └── utils.ts          # shadcn utility functions (like 'cn' for merging classes)
    │
    ├── components/           # Reusable UI Blocks
    │   ├── layout/
    │   │   ├── Navbar.tsx
    │   │   └── MainLayout.tsx# Wraps pages with Navbar and standard padding
    │   ├── movies/
    │   │   ├── MovieCard.tsx # The visual card for a movie poster
    │   │   └── ReviewItem.tsx# The visual block for a user's review
    │   └── ui/               # shadcn generated components go here
    │       ├── button.tsx    # (e.g., generated via 'bunx shadcn add button')
    │       └── input.tsx
    │
    └── pages/                # The actual "Screens" of your app
        ├── Home.tsx          # Landing page & Timeline Feed (Recent reviews)
        ├── Movies.tsx        # The "Movies" catalog and search interface
        ├── MovieDetail.tsx   # The specific movie page (/[slug] equivalent)
        ├── Profile.tsx       # User's personal logs and stats
        └── Auth.tsx          # Login and Registration screen