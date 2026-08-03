import { buildArchiveSearchParams, buildDetailSearchParams, normalizeSearchQuery } from "@/lib/query-params";
import type { SerialArchiveInput, SerialDetailInput } from "./types";

export const normalizeSeriesSearchQuery = normalizeSearchQuery;

export const toSeriesArchiveSearchParams = (input: SerialArchiveInput): URLSearchParams =>
  buildArchiveSearchParams(input);

export const toSeriesDetailSearchParams = (input: SerialDetailInput): URLSearchParams =>
  buildDetailSearchParams(input);
