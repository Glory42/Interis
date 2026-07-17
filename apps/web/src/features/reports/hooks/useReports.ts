import { useMutation } from "@tanstack/react-query";
import { submitReport, type SubmitReportInput } from "@/features/reports/api";

export const useSubmitReport = () =>
  useMutation({
    mutationFn: (input: SubmitReportInput) => submitReport(input),
  });
