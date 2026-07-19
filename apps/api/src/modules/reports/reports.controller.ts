import type { Context } from "hono";
import type { AppEnv } from "../../infrastructure/http/hono-context.types";
import { sendErrorForStatus, sendValidationError } from "../../commons/http/validation-response.hono";
import { ReportsService } from "./reports.service";
import { ListReportsQuerySchema, ReportParamsSchema, SubmitReportSchema } from "./dto/reports.dto";

export class ReportsController {
  static async submit(c: Context<AppEnv>): Promise<Response> {
    const parsed = SubmitReportSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const result = await ReportsService.submitReport(
      c.get("user").id,
      parsed.data.targetType,
      parsed.data.targetId,
      parsed.data.reason,
      parsed.data.details,
    );

    if ("error" in result) {
      return sendErrorForStatus(c, result.status, result.error);
    }

    return c.json(result, 201);
  }

  static async list(c: Context<AppEnv>): Promise<Response> {
    const parsed = ListReportsQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const reports = await ReportsService.listReports(
      parsed.data.status,
      parsed.data.limit ?? 20,
      parsed.data.offset ?? 0,
    );
    return c.json(reports, 200);
  }

  static async resolve(c: Context<AppEnv>): Promise<Response> {
    const parsed = ReportParamsSchema.safeParse(c.req.param());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const result = await ReportsService.resolveReport(parsed.data.id, c.get("user").id, "resolved");
    if ("error" in result) {
      return sendErrorForStatus(c, result.status, result.error);
    }
    return c.json(result, 200);
  }

  static async dismiss(c: Context<AppEnv>): Promise<Response> {
    const parsed = ReportParamsSchema.safeParse(c.req.param());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const result = await ReportsService.resolveReport(parsed.data.id, c.get("user").id, "dismissed");
    if ("error" in result) {
      return sendErrorForStatus(c, result.status, result.error);
    }
    return c.json(result, 200);
  }

  static async removeContent(c: Context<AppEnv>): Promise<Response> {
    const parsed = ReportParamsSchema.safeParse(c.req.param());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const result = await ReportsService.removeContent(parsed.data.id, c.get("user").id);
    if ("error" in result) {
      return sendErrorForStatus(c, result.status, result.error);
    }
    return c.json(result, 200);
  }
}
