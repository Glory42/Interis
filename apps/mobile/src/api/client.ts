import { API_BASE_URL } from "@/lib/config";

// Port of apps/web/src/lib/api-client.ts. Auth is the same httpOnly
// access/refresh cookie pair the web uses: the native networking stack
// (NSHTTPCookieStorage on iOS, OkHttp's cookie jar on Android) stores the
// Set-Cookie headers and replays them, so `credentials: "include"` is all
// the app needs - no token handling in JS.

type ApiRequestOptions<TBody> = Omit<RequestInit, "body"> & {
  body?: TBody;
  timeoutMs?: number;
};

export type QueryRequestOptions = {
  signal?: AbortSignal;
};

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

const extractErrorMessage = (payload: unknown, fallback: string): string => {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const candidate = payload as { error?: unknown; message?: unknown };
    if (typeof candidate.error === "string" && candidate.error.trim().length > 0) {
      return candidate.error;
    }

    // Unified backend error shape: { error: { message, code, details } }.
    if (candidate.error && typeof candidate.error === "object") {
      const nestedMessage = (candidate.error as { message?: unknown }).message;
      if (typeof nestedMessage === "string" && nestedMessage.trim().length > 0) {
        return nestedMessage;
      }
    }

    if (typeof candidate.message === "string" && candidate.message.trim().length > 0) {
      return candidate.message;
    }
  }

  return fallback;
};

const parseResponsePayload = async (response: Response): Promise<unknown> => {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  if (contentType.includes("text/")) {
    return response.text();
  }

  return null;
};

export const apiRequest = async <TResponse, TBody = undefined>(
  path: string,
  options: ApiRequestOptions<TBody> = {},
): Promise<TResponse> => {
  const {
    body,
    headers: customHeaders,
    signal: externalSignal,
    timeoutMs = 15_000,
    ...restOptions
  } = options;
  const headers = new Headers(customHeaders);
  headers.set("accept", "application/json");

  const isJsonBody = body !== undefined && body !== null && !(body instanceof FormData);
  if (isJsonBody && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const abortController = new AbortController();
  let didTimeout = false;

  const handleExternalAbort = (): void => abortController.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      handleExternalAbort();
    } else {
      externalSignal.addEventListener("abort", handleExternalAbort);
    }
  }

  const timeoutId = setTimeout(() => {
    didTimeout = true;
    abortController.abort();
  }, timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: "include",
      ...restOptions,
      headers,
      body: isJsonBody ? JSON.stringify(body) : (body as BodyInit | null | undefined),
      signal: abortController.signal,
    });
  } catch (error) {
    if (didTimeout) {
      throw new ApiError(408, "Request timed out. Please try again.", null);
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(0, "Unable to reach the Interis server.", null);
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", handleExternalAbort);
  }

  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      extractErrorMessage(payload, response.statusText || `Request failed with ${response.status}`),
      payload,
    );
  }

  return payload as TResponse;
};

export const getErrorMessage = (error: unknown, fallback = "Something went wrong."): string => {
  if (isApiError(error) || error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
};

export const encodeSegment = (value: string | number): string => encodeURIComponent(String(value));
