import type { Request, Response } from "express";
import {
  sendErrorForStatus,
  sendValidationError,
} from "../../commons/http/validation-response.helper";
import { ReportsService } from "./reports.service";
import {
  CloseReportTargetSchema,
  GroupedReportsQuerySchema,
  ListReportsQuerySchema,
  ReportParamsSchema,
  RemoveContentSchema,
  ReportTargetParamsSchema,
  SubmitReportSchema,
  type ListReportsQuery,
  type ReportParams,
  type ReportTargetParams,
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

    const result = await ReportsService.resolveReport(parsed.data.id, req.user, "resolved");
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

    const result = await ReportsService.resolveReport(parsed.data.id, req.user, "dismissed");
    if ("error" in result) {
      sendErrorForStatus(res, result.status, result.error);
      return;
    }
    res.status(200).json(result);
  }

  static async removeContent(req: Request<ReportParams>, res: Response): Promise<void> {
    const parsed = ReportParamsSchema.safeParse(req.params);
    const body = RemoveContentSchema.safeParse(req.body ?? {});
    if (!parsed.success || !body.success) {
      sendValidationError(res, (parsed.error ?? body.error)!);
      return;
    }

    const reason = body.data.reason || null;
    const result = await ReportsService.removeContent(parsed.data.id, req.user, {
      reason,
      notifyAuthor: body.data.notifyAuthor ?? false,
    });
    if ("error" in result) {
      sendErrorForStatus(res, result.status, result.error);
      return;
    }
    res.status(200).json(result);
  }

  static async listGrouped(req: Request, res: Response): Promise<void> {
    const parsed = GroupedReportsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const rows = await ReportsService.listGrouped(parsed.data.status, parsed.data.limit, parsed.data.offset);
    res.status(200).json(rows);
  }

  static async resolveTarget(req: Request<ReportTargetParams>, res: Response): Promise<void> {
    await ReportsController.closeTarget(req, res, "resolved");
  }

  static async dismissTarget(req: Request<ReportTargetParams>, res: Response): Promise<void> {
    await ReportsController.closeTarget(req, res, "dismissed");
  }

  private static async closeTarget(
    req: Request<ReportTargetParams>,
    res: Response,
    status: "resolved" | "dismissed",
  ): Promise<void> {
    const params = ReportTargetParamsSchema.safeParse(req.params);
    const body = CloseReportTargetSchema.safeParse(req.body ?? {});
    if (!params.success || !body.success) {
      sendValidationError(res, (params.error ?? body.error)!);
      return;
    }

    const note = body.data.note || null;
    const closed = await ReportsService.closeTarget({
      targetType: params.data.targetType,
      targetId: params.data.targetId,
      status,
      actor: req.user,
      note,
    });
    if (closed === 0) {
      sendErrorForStatus(res, 404, "No open reports on this item");
      return;
    }
    res.status(200).json({ closed });
  }
}
