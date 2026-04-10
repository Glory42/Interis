import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { GlobalSearchDialog } from "@/features/search/components/GlobalSearchDialog";
import {
  GlobalSearchDialogContext,
  type GlobalSearchDialogContextValue,
} from "@/features/search/components/global-search-dialog-context";

type GlobalSearchDialogProviderProps = {
  children: ReactNode;
};

export const GlobalSearchDialogProvider = ({
  children,
}: GlobalSearchDialogProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);

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
      <GlobalSearchDialog isOpen={isOpen} onOpenChange={setIsOpen} />
    </GlobalSearchDialogContext.Provider>
  );
};
