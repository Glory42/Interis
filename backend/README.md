backend/
├── .env                      # Database URL, TMDB Token, Auth Secret
├── drizzle.config.ts         # Tells Drizzle where to find your tables
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts              # Entry point: Mounts Pino, CORS, Auth, and Routes
    │
    ├── commons/              # Shared logic across the whole backend
    │   ├── middlewares/      # e.g., requireAuth.ts (protects private routes)
    │   └── utils/            # e.g., errorHandlers.ts, custom responses
    │
    ├── infrastructure/       # The "Outside World" integrations
    │   ├── auth/
    │   │   └── auth.ts       # Better Auth configuration
    │   ├── database/
    │   │   ├── auth.entity.ts# User & Session tables (generated)
    │   │   ├── db.ts         # Neon Postgres connection
    │   │   └── schema.ts     # Aggregator: exports all entities for Drizzle
    │   └── tmdb/
    │       └── client.ts     # TMDB fetch wrapper & Zod validation schemas
    │
    └── modules/              # Your Core Features
        ├── movies/
        │   ├── movies.controller.ts # Express route handlers (Req/Res)
        │   ├── movies.entity.ts     # The 'movie' Postgres table cache
        │   ├── movies.routes.ts     # Maps endpoints to controller functions
        │   └── movies.service.ts    # Business logic (talks to TMDB/Database)
        │
        └── reviews/
            ├── reviews.controller.ts
            ├── reviews.entity.ts    # The 'review' and 'follow' tables
            ├── reviews.routes.ts
            └── reviews.service.ts