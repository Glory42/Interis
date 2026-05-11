import type { BooksArchiveSort, BookDetailReviewSort } from "../dto/books.dto";

export type BookDetail = {
  id: number;
  googleVolumeId: string;
  title: string;
  subtitle: string | null;
  authors: string[];
  publisher: string | null;
  publishedDate: string | null;
  publishedYear: number | null;
  pageCount: number | null;
  language: string | null;
  categories: string[];
  description: string | null;
  coverImageUrl: string | null;
  isbn13: string | null;
  googleBooksUrl: string | null;
};

export type BooksArchiveItem = {
  googleVolumeId: string;
  title: string;
  authors: string[];
  coverImageUrl: string | null;
  publishedYear: number | null;
  language: string | null;
  categories: string[];
  logCount: number;
  avgRatingOutOfFive: number | null;
  viewerHasLogged: boolean;
  viewerWantToRead: boolean;
};

export type BookGenreOption = { name: string; count: number };
export type BookLanguageOption = { code: string; count: number };

export type BooksArchiveResponse = {
  totalCount: number;
  filteredCount: number;
  selectedGenre: string | null;
  selectedLanguage: string | null;
  selectedSort: BooksArchiveSort;
  availableGenres: BookGenreOption[];
  page: number;
  limit: number;
  hasMore: boolean;
  nextPage: number | null;
  items: BooksArchiveItem[];
};

export type BookLogItem = {
  diaryEntryId: string;
  readDate: string;
  rating: number | null;
  reread: boolean;
  createdAt: Date;
  username: string;
  userDisplayName: string | null;
  avatarUrl: string | null;
  reviewContent: string | null;
  reviewContainsSpoilers: boolean | null;
  reviewUpdatedAt: Date | null;
};

export type BookInteraction = {
  liked: boolean;
  wantToRead: boolean;
  ratingOutOfTen: number | null;
  ratingOutOfFive: number | null;
};

export type BookDetailUserLog = {
  diaryEntryId: string | null;
  readDate: string | null;
  reread: boolean;
  ratingOutOfTen: number | null;
  ratingOutOfFive: number | null;
};

export type BookDetailReviewItem = {
  id: string;
  content: string;
  containsSpoilers: boolean;
  createdAt: Date;
  updatedAt: Date;
  readDate: string | null;
  ratingOutOfTen: number | null;
  ratingOutOfFive: number | null;
  likeCount: number;
  viewerHasLiked: boolean;
  author: {
    id: string;
    username: string;
    displayUsername: string | null;
    image: string | null;
    avatarUrl: string | null;
  };
};

export type BookDetailResponse = {
  book: BookDetail;
  logsCount: number;
  reviewCount: number;
  userLog: BookDetailUserLog | null;
  interaction: BookInteraction | null;
  reviewsSort: BookDetailReviewSort;
  reviews: BookDetailReviewItem[];
};

export type MyBookLogEntry = {
  id: string;
  readDate: string;
  rating: number | null;
  reread: boolean;
  bookId: number;
  createdAt: Date;
  updatedAt: Date;
  bookGoogleVolumeId: string;
  bookTitle: string;
  bookAuthors: string[];
  bookCoverImageUrl: string | null;
  bookPublishedYear: number | null;
  reviewId: string | null;
  reviewContent: string | null;
};
