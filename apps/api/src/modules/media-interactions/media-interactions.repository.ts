import { and, eq } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { db } from "../../infrastructure/database/db";
import { movieInteractions } from "../interactions/interactions.entity";
import { serialInteractions } from "../serials/serials.entity";
import {
  resolveInteractionUpdate,
  type InteractionStateInput,
  type InteractionStateRow,
} from "./helpers/interaction-state-rules.helper";

type InteractionTable = typeof movieInteractions | typeof serialInteractions;

type InteractionAdapterConfig = {
  table: InteractionTable;
  fkColumn: AnyPgColumn;
  fkKey: "movieId" | "seriesId";
};

export type MediaInteractionAdapter = {
  find: (userId: string, mediaId: number) => Promise<InteractionStateRow | null>;
  upsertState: (
    userId: string,
    mediaId: number,
    input: InteractionStateInput,
  ) => Promise<InteractionStateRow | null>;
  markWatched: (userId: string, mediaId: number) => Promise<void>;
  setWatchlisted: (userId: string, mediaId: number) => Promise<void>;
  setRating: (userId: string, mediaId: number, rating: number) => Promise<void>;
  hasRating: (userId: string, mediaId: number) => Promise<boolean>;
};

// The two tables (movie_interaction, serial_interaction) have identical
// column shape - userId, <fk>Id, liked, watchlisted, rating, isWatched - so
// one generic implementation drives both adapters. The table/column typing
// gets loose inside this factory (Drizzle can't express "same shape, two
// tables" cleanly); MediaInteractionAdapter above is the fully-typed surface
// every caller actually sees.
function makeInteractionAdapter({ table, fkColumn, fkKey }: InteractionAdapterConfig): MediaInteractionAdapter {
  const userIdColumn = table.userId;

  async function find(userId: string, mediaId: number): Promise<InteractionStateRow | null> {
    const rows = (await db
      .select()
      .from(table as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .where(and(eq(userIdColumn, userId), eq(fkColumn, mediaId)))
      .limit(1)) as unknown as InteractionStateRow[];

    return rows[0] ?? null;
  }

  async function upsertState(
    userId: string,
    mediaId: number,
    input: InteractionStateInput,
  ): Promise<InteractionStateRow | null> {
    const { insertValues, updateSet } = resolveInteractionUpdate(input);

    const rows = (await db
      .insert(table as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .values({ userId, [fkKey]: mediaId, ...insertValues })
      .onConflictDoUpdate({
        target: [userIdColumn, fkColumn],
        set: updateSet,
      })
      .returning()) as unknown as InteractionStateRow[];

    return rows[0] ?? null;
  }

  async function markWatched(userId: string, mediaId: number): Promise<void> {
    await upsertState(userId, mediaId, { watched: true });
  }

  async function setWatchlisted(userId: string, mediaId: number): Promise<void> {
    await upsertState(userId, mediaId, { watchlisted: true });
  }

  async function setRating(userId: string, mediaId: number, rating: number): Promise<void> {
    await upsertState(userId, mediaId, { rating });
  }

  async function hasRating(userId: string, mediaId: number): Promise<boolean> {
    const row = await find(userId, mediaId);
    return row?.rating !== null && row?.rating !== undefined;
  }

  return { find, upsertState, markWatched, setWatchlisted, setRating, hasRating };
}

export const MediaInteractions = {
  forMovie: (): MediaInteractionAdapter =>
    makeInteractionAdapter({
      table: movieInteractions,
      fkColumn: movieInteractions.movieId,
      fkKey: "movieId",
    }),
  forSeries: (): MediaInteractionAdapter =>
    makeInteractionAdapter({
      table: serialInteractions,
      fkColumn: serialInteractions.seriesId,
      fkKey: "seriesId",
    }),
};
