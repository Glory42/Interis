import { fetchNyt } from "./client";

export type NytBestsellerItem = {
  rank: number;
  isbn13: string;
  title: string;
  author: string;
};

type NytListResponse = {
  status: string;
  results?: {
    books?: Array<{
      rank: number;
      primary_isbn13: string;
      title: string;
      author: string;
    }>;
  };
};

export const getBestsellersList = async (listName: string): Promise<NytBestsellerItem[]> => {
  const data = (await fetchNyt(`/lists/current/${listName}.json`)) as NytListResponse;
  const books = data.results?.books ?? [];

  return books
    .filter((book) => book.primary_isbn13)
    .map((book) => ({
      rank: book.rank,
      isbn13: book.primary_isbn13,
      title: book.title,
      author: book.author,
    }));
};
