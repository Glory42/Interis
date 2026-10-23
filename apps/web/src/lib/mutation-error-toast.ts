import type { Mutation } from "@tanstack/react-query";
import { isApiError } from "./api-client";
import { showToast } from "./toast";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      // Set on mutations that roll back an optimistic update on failure, so
      // the user learns why their click was undone. The text is the toast's
      // title; the API's error message goes underneath it.
      errorToast?: string;
    };
  }
}

export const showMutationErrorToast = (
  error: unknown,
  _variables: unknown,
  _context: unknown,
  mutation: Mutation<unknown, unknown, unknown>,
): void => {
  const title = mutation.meta?.errorToast;
  if (!title) {
    return;
  }

  showToast(title, isApiError(error) ? error.message : null);
};
