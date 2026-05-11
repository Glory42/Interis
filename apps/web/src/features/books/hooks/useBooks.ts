import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createBookLog,
  deleteBookLog,
  getBooksArchive,
  getBookDetail,
  getBookInteraction,
  getMyBookLogs,
  searchBooks,
  updateBookInteraction,
  updateBookLog,
  type BooksArchiveSort,
  type BookDetailReviewSort,
  type BookInteraction,
  type CreateBookLogInput,
  type MyBookLog,
  type UpdateBookInteractionInput,
  type UpdateBookLogInput,
} from "@/features/books/api";

export const bookKeys = {
  all: ["books"] as const,
  search: (query: string) => ["books", "search", query] as const,
  detailView: (volumeId: string, reviewsSort: BookDetailReviewSort) =>
    ["books", "detail-view", volumeId, reviewsSort] as const,
  interaction: (volumeId: string) => ["books", "interaction", volumeId] as const,
  myLogs: ["books", "my-logs"] as const,
  archive: (genre: string, language: string, sort: BooksArchiveSort, limit: number) =>
    ["books", "archive", genre, language, sort, limit] as const,
};

export const useBookSearch = (query: string) =>
  useQuery({
    queryKey: bookKeys.search(query),
    queryFn: ({ signal }) => searchBooks(query, undefined, { signal }),
    enabled: query.trim().length >= 2,
  });

export const useBookDetailView = (
  volumeId: string,
  reviewsSort: BookDetailReviewSort,
  enabled = true,
) =>
  useQuery({
    queryKey: bookKeys.detailView(volumeId, reviewsSort),
    queryFn: ({ signal }) => getBookDetail(volumeId, { reviewsSort }, { signal }),
    enabled: enabled && volumeId.length > 0,
  });

export const useBookInteraction = (volumeId: string, enabled = true) =>
  useQuery({
    queryKey: bookKeys.interaction(volumeId),
    queryFn: () => getBookInteraction(volumeId),
    enabled: enabled && volumeId.length > 0,
  });

export const useUpdateBookInteraction = (volumeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateBookInteractionInput) =>
      updateBookInteraction(volumeId, input),
    onMutate: async (input) => {
      const queryKey = bookKeys.interaction(volumeId);
      await queryClient.cancelQueries({ queryKey });
      const previousState = queryClient.getQueryData<BookInteraction>(queryKey);
      if (previousState) {
        queryClient.setQueryData<BookInteraction>(queryKey, {
          ...previousState,
          ...(input.liked !== undefined ? { liked: input.liked } : {}),
          ...(input.wantToRead !== undefined ? { wantToRead: input.wantToRead } : {}),
          ...(input.ratingOutOfFive !== undefined ? { ratingOutOfFive: input.ratingOutOfFive } : {}),
        });
      }
      return { previousState };
    },
    onError: (_error, _input, context) => {
      if (!context?.previousState) return;
      queryClient.setQueryData(bookKeys.interaction(volumeId), context.previousState);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: bookKeys.interaction(volumeId) });
    },
  });
};

export const useCreateBookLog = (volumeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBookLogInput) => createBookLog(volumeId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.myLogs });
      queryClient.invalidateQueries({ queryKey: bookKeys.all });
    },
  });
};

export const useMyBookLogs = () =>
  useQuery({
    queryKey: bookKeys.myLogs,
    queryFn: getMyBookLogs,
  });

export const useUpdateBookLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, input }: { entryId: string; input: UpdateBookLogInput }) =>
      updateBookLog(entryId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.myLogs });
    },
  });
};

export const useDeleteBookLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => deleteBookLog(entryId),
    onSuccess: (_data, entryId) => {
      queryClient.invalidateQueries({ queryKey: bookKeys.myLogs });
      queryClient.setQueryData<MyBookLog[]>(bookKeys.myLogs, (prev) =>
        prev ? prev.filter((e) => e.id !== entryId) : prev,
      );
    },
  });
};

export const useBooksArchive = (
  genre: string,
  language: string,
  sort: BooksArchiveSort,
  limit: number,
) =>
  useInfiniteQuery({
    queryKey: bookKeys.archive(genre, language, sort, limit),
    initialPageParam: 1,
    queryFn: ({ signal, pageParam }) => {
      const page = typeof pageParam === "number" ? pageParam : 1;
      return getBooksArchive({ genre, language, sort, page, limit }, { signal });
    },
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
  });
