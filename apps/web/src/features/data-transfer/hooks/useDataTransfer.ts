import { useMutation } from "@tanstack/react-query";
import { exportDiary } from "../api";

export function useExportDiary() {
  return useMutation({ mutationFn: exportDiary });
}
