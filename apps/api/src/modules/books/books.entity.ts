import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uuid,
  unique,
} from "drizzle-orm/pg-core";
import { user } from "../../infrastructure/database/auth.entity";

export const books = pgTable("book", {
  id: serial("id").primaryKey(),
  googleVolumeId: text("google_volume_id").notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  authors: jsonb("authors").$type<string[]>().notNull().$default(() => []),
  publisher: text("publisher"),
  publishedDate: text("published_date"),
  publishedYear: integer("published_year"),
  pageCount: integer("page_count"),
  language: text("language"),
  categories: jsonb("categories").$type<string[]>(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  isbn13: text("isbn_13"),
  googleBooksUrl: text("google_books_url"),
  cachedAt: timestamp("cached_at").defaultNow().notNull(),
});

export const bookDiaryEntries = pgTable("book_diary_entry", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  bookId: integer("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  readDate: text("read_date").notNull(),
  rating: integer("rating"),
  reread: boolean("reread").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const bookInteractions = pgTable(
  "book_interaction",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    bookId: integer("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    liked: boolean("liked").default(false).notNull(),
    wantToRead: boolean("want_to_read").default(false).notNull(),
    rating: integer("rating"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [unique("book_interactions_unique").on(table.userId, table.bookId)],
);
