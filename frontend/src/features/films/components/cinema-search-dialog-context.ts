import { createContext } from "react";

export type CinemaSearchDialogContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  setOpen: (isOpen: boolean) => void;
};

export const CinemaSearchDialogContext =
  createContext<CinemaSearchDialogContextValue | null>(null);
