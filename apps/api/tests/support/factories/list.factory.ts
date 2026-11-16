import { eq } from "drizzle-orm";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { listCollaborators, listEntries } from "../../../src/modules/lists/lists.entity";
import type { CookieJar } from "../app/cookie-jar";
import { apiRequest } from "../app/http-client";
import { seedTestFilm } from "./media.factory";

export const userIdOf = async (username: string): Promise<string> => {
  const [row] = await db.select({ id: user.id }).from(user).where(eq(user.username, username));
  if (!row) throw new Error(`No user ${username}`);
  return row.id;
};

export const jsonRequest = (baseUrl: string, path: string, method: string, body: unknown, jar?: CookieJar) =>
  apiRequest(
    baseUrl,
    path,
    {
      method,
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    jar,
  );

export const createListViaApi = async (
  baseUrl: string,
  jar: CookieJar,
  input: { title?: string; isPublic?: boolean } = {},
): Promise<{ id: string }> => {
  const response = await jsonRequest(baseUrl, "/api/lists", "POST", { title: "Shared list", ...input }, jar);
  if (response.status !== 201) throw new Error(`Failed to create list: ${response.status}`);
  return (await response.json()) as { id: string };
};

// Straight into the DB: role setup for permission tests, without the notification side effects.
export const seedCollaborator = async (
  listId: string,
  userId: string,
  invitedByUserId: string,
  status: "invited" | "accepted",
) => {
  await db.insert(listCollaborators).values({ listId, userId, invitedByUserId, status });
};

export const seedListEntries = async (listId: string, count: number): Promise<string[]> => {
  const films = await Promise.all(Array.from({ length: count }, (_, i) => seedTestFilm(`Seeded ${i}`)));
  const rows = await db
    .insert(listEntries)
    .values(films.map((film, i) => ({ listId, movieId: film.id, itemType: "movie", position: i + 1 })))
    .returning({ id: listEntries.id, position: listEntries.position });
  return rows.sort((a, b) => a.position - b.position).map((r) => r.id);
};
