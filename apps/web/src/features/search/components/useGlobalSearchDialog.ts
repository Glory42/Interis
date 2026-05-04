import { useContext } from "react";
import { GlobalSearchDialogContext } from "@/features/search/components/global-search-dialog-context";

export const useGlobalSearchDialog = () => {
  const context = useContext(GlobalSearchDialogContext);
  if (!context) {
    throw new Error(
      "useGlobalSearchDialog must be used within GlobalSearchDialogProvider",
    );
  }

  return context;
};
