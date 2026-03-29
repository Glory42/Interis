import { useContext } from "react";
import { CinemaSearchDialogContext } from "@/features/films/components/cinema-search-dialog-context";

export const useCinemaSearchDialog = () => {
  const context = useContext(CinemaSearchDialogContext);
  if (!context) {
    throw new Error(
      "useCinemaSearchDialog must be used within CinemaSearchDialogProvider",
    );
  }

  return context;
};
