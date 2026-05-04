import type { Request, Response } from "express";
import { DataExportService } from "./services/export.service";
import { DataImportService } from "./services/import.service";

export class DataTransferController {
  static async export(req: Request, res: Response): Promise<void> {
    const csv = await DataExportService.exportDiary(req.user.id);
    const date = new Date().toISOString().slice(0, 10);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="interis-diary-${date}.csv"`,
    );
    res.status(200).send(csv);
  }

  static async import(req: Request, res: Response): Promise<void> {
    const body = req.body;

    if (typeof body !== "string" || body.trim().length === 0) {
      res.status(400).json({ error: "Request body must be a non-empty CSV text." });
      return;
    }

    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    await DataImportService.importCsvStreaming(req.user.id, body, (event) => {
      res.write(`${JSON.stringify(event)}\n`);
    });

    res.end();
  }
}
