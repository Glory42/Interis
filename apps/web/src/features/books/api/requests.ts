import { apiRequest } from "@/lib/api-client";
import {
  bookDetailSchema,
  bookDetailResponseSchema,
  bookInteractionSchema,
  bookLogsListSchema,
  booksArchiveResponseSchema,
  googleBooksSearchResponseSchema,
  myBookLogsListSchema,
  updateBookInteractionInputSchema,
  updateBookLogInputSchema,
  createBookLogInputSchema,
  createBookLogResultSchema,
} from "./schemas";
import type {
  BookDetail,
  BookDetailInput,
  BookDetailResponse,
  BookInteraction,
  BookLogItem,
  BooksArchiveInput,
  BooksArchiveResponse,
  CreateBookLogInput,
  CreateBookLogResult,
  GoogleBooksVolume,
  MyBookLog,
  QueryRequestOptions,
  UpdateBookInteractionInput,
  UpdateBookLogInput,
} from "./types";

function toBooksArchiveParams(input: BooksArchiveInput): string {
  const params = new URLSearchParams();
  if (input.genre) params.set("genre", input.genre);
  if (input.language) params.set("language", input.language);
  if (input.sort) params.set("sort", input.sort);
  if (input.page) params.set("page", String(input.page));
  if (input.limit) params.set("limit", String(input.limit));
  return params.toString();
}

export const searchBooks = async (
  query: string,
  language?: string,
  options: QueryRequestOptions = {},
): Promise<GoogleBooksVolume[]> => {
  const q = query.trim();
  if (q.length === 0) return [];
  const params = new URLSearchParams({ query: q });
  if (language) params.set("language", language);
  const response = await apiRequest<unknown>(
    `/api/books/search?${params.toString()}`,
    { method: "GET", signal: options.signal },
  );
  return googleBooksSearchResponseSchema.parse(response);
};

export const getBookByVolumeId = async (
  volumeId: string,
  options: QueryRequestOptions = {},
): Promise<BookDetail> => {
  const response = await apiRequest<unknown>(`/api/books/${volumeId}`, {
    method: "GET",
    signal: options.signal,
  });
  return bookDetailSchema.parse(response);
};

export const getBookDetail = async (
  volumeId: string,
  input: BookDetailInput = {},
  options: QueryRequestOptions = {},
): Promise<BookDetailResponse> => {
  const params = new URLSearchParams();
  if (input.reviewsSort) params.set("reviewsSort", input.reviewsSort);
  const query = params.toString();
  const path = query
    ? `/api/books/${volumeId}/detail?${query}`
    : `/api/books/${volumeId}/detail`;
  const response = await apiRequest<unknown>(path, {
    method: "GET",
    signal: options.signal,
    cache: "no-store",
  });
  return bookDetailResponseSchema.parse(response);
};

export const getBooksArchive = async (
  input: BooksArchiveInput,
  options: QueryRequestOptions = {},
): Promise<BooksArchiveResponse> => {
  const query = toBooksArchiveParams(input);
  const path = query ? `/api/books/archive?${query}` : "/api/books/archive";
  const response = await apiRequest<unknown>(path, {
    method: "GET",
    signal: options.signal,
    cache: "no-store",
  });
  return booksArchiveResponseSchema.parse(response);
};

export const getBookLogs = async (
  volumeId: string,
  options: QueryRequestOptions = {},
): Promise<BookLogItem[]> => {
  const response = await apiRequest<unknown>(`/api/books/${volumeId}/logs`, {
    method: "GET",
    signal: options.signal,
  });
  return bookLogsListSchema.parse(response);
};

export const getBookInteraction = async (volumeId: string): Promise<BookInteraction> => {
  const response = await apiRequest<unknown>(`/api/books/${volumeId}/interaction`, {
    method: "GET",
  });
  return bookInteractionSchema.parse(response);
};

export const updateBookInteraction = async (
  volumeId: string,
  input: UpdateBookInteractionInput,
): Promise<BookInteraction> => {
  const payload = updateBookInteractionInputSchema.parse(input);
  const response = await apiRequest<unknown, UpdateBookInteractionInput>(
    `/api/books/${volumeId}/interaction`,
    { method: "PUT", body: payload },
  );
  return bookInteractionSchema.parse(response);
};

export const createBookLog = async (
  volumeId: string,
  input: CreateBookLogInput,
): Promise<CreateBookLogResult> => {
  const payload = createBookLogInputSchema.parse(input);
  const response = await apiRequest<unknown, CreateBookLogInput>(`/api/books/${volumeId}/log`, {
    method: "POST",
    body: payload,
  });
  return createBookLogResultSchema.parse(response);
};

export const getMyBookLogs = async (): Promise<MyBookLog[]> => {
  const response = await apiRequest<unknown>("/api/books/logs", { method: "GET" });
  return myBookLogsListSchema.parse(response);
};

export const updateBookLog = async (
  entryId: string,
  input: UpdateBookLogInput,
): Promise<MyBookLog> => {
  const payload = updateBookLogInputSchema.parse(input);
  const response = await apiRequest<unknown, UpdateBookLogInput>(
    `/api/books/logs/${entryId}`,
    { method: "PUT", body: payload },
  );
  return myBookLogsListSchema.element.parse(response);
};

export const deleteBookLog = async (entryId: string): Promise<void> => {
  await apiRequest<unknown>(`/api/books/logs/${entryId}`, { method: "DELETE" });
};
