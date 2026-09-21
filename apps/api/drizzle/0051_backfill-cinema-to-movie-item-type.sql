-- Backfill the "cinema" discriminant value to "movie" (films/serials naming
-- unification, see docs/adr/0002-movie-as-canonical-naming-across-frontend-and-backend.md).
UPDATE "list_entry" SET "item_type" = 'movie' WHERE "item_type" = 'cinema';
UPDATE "list" SET "derived_type" = 'movie' WHERE "derived_type" = 'cinema';
