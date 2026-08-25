/**
 * Clamps an untrusted page-size input to `[1, options.max]`, falling back to
 * `options.default` when `limit` is missing, zero, or not a number.
 */
export const normalizeBoundedLimit = (
  limit: number | undefined,
  options: { default: number; max: number },
): number => {
  if (!limit || Number.isNaN(limit)) {
    return options.default;
  }

  return Math.max(1, Math.min(limit, options.max));
};
