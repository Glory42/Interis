import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CinemaSearchDialog } from "@/features/films/components/CinemaSearchDialog";
import {
  CinemaSearchDialogContext,
  type CinemaSearchDialogContextValue,
} from "@/features/films/components/cinema-search-dialog-context";

type CinemaSearchDialogProviderProps = {
  children: ReactNode;
};

export const CinemaSearchDialogProvider = ({
  children,
}: CinemaSearchDialogProviderProps) => {
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

  const value = useMemo<CinemaSearchDialogContextValue>(
    () => ({
      isOpen,
      open,
      close,
      setOpen,
    }),
    [close, isOpen, open, setOpen],
  );

  return (
    <CinemaSearchDialogContext.Provider value={value}>
      {children}
      <CinemaSearchDialog isOpen={isOpen} onOpenChange={setIsOpen} />
    </CinemaSearchDialogContext.Provider>
  );
};
