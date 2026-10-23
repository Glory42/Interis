const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_TIMEOUT_MS = 8_000;
const TMDB_MAX_RETRIES = 2;

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

class NonRetryableTmdbError extends Error {}

const isRetryableStatus = (status: number): boolean => {
  return status === 429 || status >= 500;
};

export const fetchTMDB = async (endpoint: string): Promise<unknown> => {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) {
    throw new Error("TMDB_ACCESS_TOKEN is missing in .env");
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= TMDB_MAX_RETRIES; attempt += 1) {
    const abortController = new AbortController();
    const timeout = setTimeout(() => {
      abortController.abort();
    }, TMDB_TIMEOUT_MS);

    try {
      const response = await fetch(`${TMDB_BASE_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          accept: "application/json",
        },
        signal: abortController.signal,
      });

      if (!response.ok) {
        const message = `TMDB Error: ${response.status} ${response.statusText}`;
        // A 4xx won't change on retry, so fail on the first one (#108).
        throw isRetryableStatus(response.status)
          ? new Error(message)
          : new NonRetryableTmdbError(message);
      }

      return response.json();
    } catch (error) {
      if (error instanceof NonRetryableTmdbError) {
        throw error;
      }

      const normalizedError =
        error instanceof Error ? error : new Error("Unknown TMDB fetch error");

      lastError = normalizedError;
      if (attempt >= TMDB_MAX_RETRIES) {
        break;
      }

      await wait((attempt + 1) * 200);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error("TMDB request failed");
};
