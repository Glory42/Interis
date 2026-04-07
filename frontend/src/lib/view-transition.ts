type ViewTransitionStartArg = Parameters<Document["startViewTransition"]>[0];

type PatchedDocument = Document & {
  __ticViewTransitionPatched?: boolean;
};

const isPromiseLike = (value: unknown): value is Promise<unknown> => {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof value.then === "function"
  );
};

const reportUnhandledViewTransitionError = (error: unknown): void => {
  if (isViewTransitionInvalidStateError(error)) {
    return;
  }

  console.error("View transition error", error);
};

const attachTransitionRejectionHandlers = (transition: ViewTransition): void => {
  void transition.ready.catch(reportUnhandledViewTransitionError);
  void transition.finished.catch(reportUnhandledViewTransitionError);
  void transition.updateCallbackDone.catch(reportUnhandledViewTransitionError);
};

const createNoopViewTransition = (
  updateCallbackDone: Promise<void>,
): ViewTransition => {
  const settled = updateCallbackDone.then(() => undefined);

  return {
    ready: settled,
    finished: settled,
    updateCallbackDone,
    skipTransition: () => undefined,
    types: new Set<string>() as ViewTransitionTypeSet,
  };
};

const runViewTransitionUpdateImmediately = (
  callbackOptions: ViewTransitionStartArg,
): Promise<void> => {
  const updateCallback =
    typeof callbackOptions === "function"
      ? callbackOptions
      : callbackOptions?.update;

  if (typeof updateCallback !== "function") {
    return Promise.resolve();
  }

  try {
    const callbackResult = updateCallback();
    if (isPromiseLike(callbackResult)) {
      return callbackResult
        .then(() => undefined)
        .catch((error) => {
          reportUnhandledViewTransitionError(error);
        });
    }

    return Promise.resolve();
  } catch (error) {
    reportUnhandledViewTransitionError(error);
    return Promise.resolve();
  }
};

export const isViewTransitionInvalidStateError = (error: unknown): boolean => {
  if (error instanceof DOMException) {
    return error.name === "InvalidStateError";
  }

  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { name?: unknown };
  return candidate.name === "InvalidStateError";
};

export const navigateWithViewTransitionFallback = async <T>(
  runWithViewTransition: () => Promise<T>,
  runWithoutViewTransition: () => Promise<T>,
): Promise<T> => {
  try {
    return await runWithViewTransition();
  } catch (error) {
    if (!isViewTransitionInvalidStateError(error)) {
      throw error;
    }

    return runWithoutViewTransition();
  }
};

export const installSafeViewTransitions = (): void => {
  if (
    typeof document === "undefined" ||
    !("startViewTransition" in document) ||
    typeof document.startViewTransition !== "function"
  ) {
    return;
  }

  const patchedDocument = document as PatchedDocument;
  if (patchedDocument.__ticViewTransitionPatched) {
    return;
  }

  const nativeStartViewTransition = document.startViewTransition.bind(document);

  const safeStartViewTransition: Document["startViewTransition"] = (
    callbackOptions,
  ) => {
    try {
      const transition = nativeStartViewTransition(callbackOptions);
      attachTransitionRejectionHandlers(transition);
      return transition;
    } catch (error) {
      if (!isViewTransitionInvalidStateError(error)) {
        throw error;
      }

      const updateCallbackDone = runViewTransitionUpdateImmediately(callbackOptions);
      return createNoopViewTransition(updateCallbackDone);
    }
  };

  document.startViewTransition = safeStartViewTransition;
  patchedDocument.__ticViewTransitionPatched = true;
};
