import {
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { PersonRouteRole } from "./types/people.types";

export const people = pgTable("person", {
  id: serial("id").primaryKey(),
  tmdbPersonId: integer("tmdb_person_id").notNull().unique(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  knownForDepartment: text("known_for_department"),
  routeRoleHints: jsonb("route_role_hints")
    .$type<PersonRouteRole[]>()
    .default([])
    .notNull(),
  profilePath: text("profile_path"),
  popularity: real("popularity"),
  cachedAt: timestamp("cached_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const personSlugAliases = pgTable("person_slug_alias", {
  id: serial("id").primaryKey(),
  personId: integer("person_id")
    .notNull()
    .references(() => people.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
