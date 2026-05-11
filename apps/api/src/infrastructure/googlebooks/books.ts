import { fetchGB } from "./client";

export type GoogleBooksVolumeInfo = {
  title: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  pageCount?: number;
  printedPageCount?: number;
  language?: string;
  categories?: string[];
  averageRating?: number;
  ratingsCount?: number;
  imageLinks?: {
    smallThumbnail?: string;
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    extraLarge?: string;
  };
  industryIdentifiers?: Array<{ type: string; identifier: string }>;
  infoLink?: string;
  previewLink?: string;
  canonicalVolumeLink?: string;
  maturityRating?: string;
  printType?: string;
};

export type GoogleBooksVolume = {
  id: string;
  volumeInfo: GoogleBooksVolumeInfo;
};

type SearchResponse = {
  totalItems?: number;
  items?: GoogleBooksVolume[];
};

export const searchBooks = async (query: string): Promise<GoogleBooksVolume[]> => {
  const data = (await fetchGB("/volumes", {
    q: query,
    printType: "books",
    maxResults: "20",
  })) as SearchResponse;
  return data.items ?? [];
};

export const getBookDetail = async (volumeId: string): Promise<GoogleBooksVolume> => {
  return (await fetchGB(`/volumes/${volumeId}`)) as GoogleBooksVolume;
};

export const extractIsbn13 = (vi: GoogleBooksVolumeInfo): string | null => {
  const isbn = vi.industryIdentifiers?.find((id) => id.type === "ISBN_13");
  return isbn?.identifier ?? null;
};

export const parseCoverUrl = (vi: GoogleBooksVolumeInfo): string | null => {
  const raw = vi.imageLinks?.thumbnail ?? vi.imageLinks?.smallThumbnail ?? null;
  return raw ? raw.replace(/^http:\/\//, "https://") : null;
};

export const parsePublishedYear = (vi: GoogleBooksVolumeInfo): number | null => {
  if (!vi.publishedDate) return null;
  const year = Number.parseInt(vi.publishedDate.slice(0, 4), 10);
  return Number.isNaN(year) ? null : year;
};

export const stripHtml = (html: string): string =>
  html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
