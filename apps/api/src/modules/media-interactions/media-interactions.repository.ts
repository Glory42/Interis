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
  // Series have no watched column: watch_status is their watched truth
  // (#65), so `isWatched` is derived from it and never written (#105).
  watchedFromStatus: boolean;
};

type StoredRow = Omit<InteractionStateRow, "isWatched"> & {
  isWatched?: boolean;
  watchStatus?: string | null;
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

// The two tables (movie_interaction, serial_interaction) share the column
// shape - userId, <fk>Id, liked, watchlisted, rating - so one generic
// implementation drives both adapters; only movies store isWatched. The table/column typing
// gets loose inside this factory (Drizzle can't express "same shape, two
// tables" cleanly); MediaInteractionAdapter above is the fully-typed surface
// every caller actually sees.
function makeInteractionAdapter({
  table,
  fkColumn,
  fkKey,
  watchedFromStatus,
}: InteractionAdapterConfig): MediaInteractionAdapter {
  const userIdColumn = table.userId;

  const toStateRow = (row: StoredRow | undefined): InteractionStateRow | null => {
    if (!row) return null;
    return watchedFromStatus
      ? { ...row, isWatched: row.watchStatus === "completed" }
      : (row as InteractionStateRow);
  };

  const withoutWatched = <T extends Partial<InteractionStateRow>>(values: T) => {
    if (!watchedFromStatus) return values;
    const { isWatched: _isWatched, ...rest } = values;
    return rest;
  };

  async function find(userId: string, mediaId: number): Promise<InteractionStateRow | null> {
    const rows = (await db
      .select()
      .from(table as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .where(and(eq(userIdColumn, userId), eq(fkColumn, mediaId)))
      .limit(1)) as unknown as StoredRow[];

    return toStateRow(rows[0]);
  }

  async function upsertState(
    userId: string,
    mediaId: number,
    input: InteractionStateInput,
  ): Promise<InteractionStateRow | null> {
    const { insertValues, updateSet } = resolveInteractionUpdate(input);
    const set = withoutWatched(updateSet);

    const rows = (await db
      .insert(table as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .values({ userId, [fkKey]: mediaId, ...withoutWatched(insertValues) })
      .onConflictDoUpdate({
        target: [userIdColumn, fkColumn],
        // A series `watched` toggle changes no column here, but the upsert
        // still has to return the row.
        set: Object.keys(set).length > 0 ? set : { updatedAt: new Date() },
      })
      .returning()) as unknown as StoredRow[];

    return toStateRow(rows[0]);
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
      watchedFromStatus: false,
    }),
  forSeries: (): MediaInteractionAdapter =>
    makeInteractionAdapter({
      table: serialInteractions,
      fkColumn: serialInteractions.seriesId,
      fkKey: "seriesId",
      watchedFromStatus: true,
    }),
};
