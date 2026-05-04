import express, { Router } from "express";
import { DataTransferController } from "./data-transfer.controller";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { asyncHandler } from "../../commons/utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.get("/export", asyncHandler(DataTransferController.export));

router.post(
  "/import",
  express.text({ type: "text/csv", limit: "10mb" }),
  asyncHandler(DataTransferController.import),
);

export default router;
