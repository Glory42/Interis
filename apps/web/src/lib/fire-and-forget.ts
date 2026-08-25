// Runs an async submit handler that's invoked fire-and-forget (`void handler()`
// from an onClick) and swallows a rejection so it can never surface as an
// unhandled promise rejection. The mutation's own `isError`/`error` state
// (from useMutation) is still the source of truth for error UI - this only
// owns the "someone has to catch it" concern at the call site.
export const runDialogSubmit = async (submit: () => Promise<void>): Promise<boolean> => {
  try {
    await submit();
    return true;
  } catch {
    return false;
  }
};
