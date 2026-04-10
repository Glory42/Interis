import { createContext } from "react";

export type GlobalSearchDialogContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  setOpen: (isOpen: boolean) => void;
};

export const GlobalSearchDialogContext =
  createContext<GlobalSearchDialogContextValue | null>(null);
