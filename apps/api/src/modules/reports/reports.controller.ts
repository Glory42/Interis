import type { Request, Response } from "express";
import {
  sendErrorForStatus,
  sendValidationError,
} from "../../commons/http/validation-response.helper";
import { ReportsService } from "./reports.service";
import {
  ListReportsQuerySchema,
  ReportParamsSchema,
  SubmitReportSchema,
  type ListReportsQuery,
  type ReportParams,
} from "./dto/reports.dto";

export class ReportsController {
  static async submit(req: Request, res: Response): Promise<void> {
    const parsed = SubmitReportSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const result = await ReportsService.submitReport(
      req.user.id,
      parsed.data.targetType,
      parsed.data.targetId,
      parsed.data.reason,
      parsed.data.details,
    );

    if ("error" in result) {
      sendErrorForStatus(res, result.status, result.error);
      return;
    }

    res.status(201).json(result);
  }

  static async list(
    req: Request<{}, {}, {}, ListReportsQuery>,
    res: Response,
  ): Promise<void> {
    const parsed = ListReportsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const reports = await ReportsService.listReports(
      parsed.data.status,
      parsed.data.limit ?? 20,
      parsed.data.offset ?? 0,
    );
    res.status(200).json(reports);
  }

  static async resolve(req: Request<ReportParams>, res: Response): Promise<void> {
    const parsed = ReportParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const result = await ReportsService.resolveReport(parsed.data.id, req.user.id, "resolved");
    if ("error" in result) {
      sendErrorForStatus(res, result.status, result.error);
      return;
    }
    res.status(200).json(result);
  }

  static async dismiss(req: Request<ReportParams>, res: Response): Promise<void> {
    const parsed = ReportParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const result = await ReportsService.resolveReport(parsed.data.id, req.user.id, "dismissed");
    if ("error" in result) {
      sendErrorForStatus(res, result.status, result.error);
      return;
    }
    res.status(200).json(result);
  }
}
