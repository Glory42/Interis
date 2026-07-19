import type { Context } from "hono";
import { stream } from "hono/streaming";
import type { AppEnv } from "../../infrastructure/http/hono-context.types";
import { DataExportService } from "./services/export.service";
import { DataImportService } from "./services/import.service";
import { sendBadRequest } from "../../commons/http/validation-response.hono";

export class DataTransferController {
  static async export(c: Context<AppEnv>): Promise<Response> {
    const csv = await DataExportService.exportDiary(c.get("user").id);
    const date = new Date().toISOString().slice(0, 10);

    return c.body(csv, 200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="interis-diary-${date}.csv"`,
    });
  }

  static async import(c: Context<AppEnv>): Promise<Response> {
    const body = await c.req.text();

    if (body.trim().length === 0) {
      return sendBadRequest(c, "Request body must be a non-empty CSV text.");
    }

    const userId = c.get("user").id;
    const filename = c.req.query("filename");

    c.header("Content-Type", "application/x-ndjson");
    c.header("Cache-Control", "no-cache");
    c.header("X-Accel-Buffering", "no");

    return stream(c, async (honoStream) => {
      await DataImportService.importCsvStreaming(
        userId,
        body,
        (event) => {
          void honoStream.write(`${JSON.stringify(event)}\n`);
        },
        filename,
      );
    });
  }
}
