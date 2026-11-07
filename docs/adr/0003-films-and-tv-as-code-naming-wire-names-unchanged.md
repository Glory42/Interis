# Code says Film and TV; URLs, the API and the database keep movie and serial

Supersedes the naming half of [0002](0002-movie-as-canonical-naming-across-frontend-and-backend.md).

The redesign renamed the two sections to **Films** and **TV** in every piece of UI copy. Code that still said `movies`/`serials` made every change a translation, and Film/TV-shared helpers had drifted into one side (TMDB poster and backdrop urls, the language label and the archive count lived in both `features/movies` and `features/serials`).

So code now follows the UI: `modules/films` and `modules/tv` in the API, `features/films` and `features/tv` in the web app, and `Film*` / `Series*` / `Tv*` for components, hooks, services, repositories, types and table constants (Film for one film, Series for one show, Tv for the section or module). Anything shared by both lives in `media` (`features/media/tmdb-images.ts`, `features/media/labels.ts`, `modules/media/*`).

The wire stays as it was: page URLs (`/movies/:tmdbId`, `/serials/:tmdbId`), API paths (`/api/movies`, `/api/serials`, `/api/public/*`), table and column names (`movies`, `tv_series`, `movie_id`, `serial_diary_entry`), JSON fields and enum values (`mediaType: "movie" | "tv"`). Renaming those would break bookmarks, search results and external widgets, and need a data migration, for no change a user could see. Unlike 0002, nothing is renamed outside the code, so no redirect or migration was needed.
