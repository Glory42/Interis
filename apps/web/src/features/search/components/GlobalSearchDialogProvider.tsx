import {
  lazy,
  Suspense,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  GlobalSearchDialogContext,
  type GlobalSearchDialogContextValue,
} from "@/features/search/components/global-search-dialog-context";

// Most visits never open search: keep the dialog, its hooks and focus-lock out of the main chunk.
const GlobalSearchDialog = lazy(() =>
  import("@/features/search/components/GlobalSearchDialog").then((module) => ({
    default: module.GlobalSearchDialog,
  })),
);

type GlobalSearchDialogProviderProps = {
  children: ReactNode;
};

export const GlobalSearchDialogProvider = ({
  children,
}: GlobalSearchDialogProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  // Stays mounted once loaded, so closing still animates and keeps its state.
  const [hasOpened, setHasOpened] = useState(false);
  if (isOpen && !hasOpened) {
    setHasOpened(true);
  }

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const setOpen = useCallback((nextIsOpen: boolean) => {
    setIsOpen(nextIsOpen);
  }, []);

  const value = useMemo<GlobalSearchDialogContextValue>(
    () => ({
      isOpen,
      open,
      close,
      setOpen,
    }),
    [close, isOpen, open, setOpen],
  );

  return (
    <GlobalSearchDialogContext.Provider value={value}>
      {children}
      {hasOpened ? (
        <Suspense fallback={null}>
          <GlobalSearchDialog isOpen={isOpen} onOpenChange={setIsOpen} />
        </Suspense>
      ) : null}
    </GlobalSearchDialogContext.Provider>
  );
};
