type ApiRequestOptions<TBody> = Omit<RequestInit, "body"> & {
  body?: TBody;
  timeoutMs?: number;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

const extractErrorMessage = (
  payload: unknown,
  fallback: string,
): string => {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const candidate = payload as { error?: unknown; message?: unknown };
    if (typeof candidate.error === "string" && candidate.error.trim().length > 0) {
      return candidate.error;
    }

    if (
      typeof candidate.message === "string" &&
      candidate.message.trim().length > 0
    ) {
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

export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError;

export const apiRequest = async <TResponse, TBody = undefined>(
  path: string,
  options: ApiRequestOptions<TBody> = {},
): Promise<TResponse> => {
  const {
    body,
    headers: customHeaders,
    signal: externalSignal,
    timeoutMs = 10_000,
    ...restOptions
  } = options;
  const headers = new Headers(customHeaders);

  const isJsonBody =
    body !== undefined && body !== null && !(body instanceof FormData);

  if (isJsonBody && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const requestBody = isJsonBody
    ? JSON.stringify(body)
    : (body as BodyInit | null | undefined);

  const abortController = new AbortController();
  let didTimeout = false;

  const handleExternalAbort = (): void => {
    abortController.abort(
      externalSignal?.reason instanceof Error
        ? externalSignal.reason
        : undefined,
    );
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      handleExternalAbort();
    } else {
      externalSignal.addEventListener("abort", handleExternalAbort, {
        once: true,
      });
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
      body: requestBody,
      signal: abortController.signal,
    });
  } catch (error) {
    if (didTimeout) {
      throw new ApiError(408, "Request timed out. Please try again.", null);
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(0, "Unable to reach API server.", null);
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", handleExternalAbort);
  }

  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    const fallbackMessage =
      response.statusText || `Request failed with ${response.status}`;
    throw new ApiError(
      response.status,
      extractErrorMessage(payload, fallbackMessage),
      payload,
    );
  }

  return payload as TResponse;
};
