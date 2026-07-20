import { Router } from "express";
import { DiaryController } from "./diary.controller";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { asyncHandler } from "../../commons/utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(DiaryController.getMyDiary));
router.post("/", asyncHandler(DiaryController.create));
router.put("/:id", asyncHandler(DiaryController.update));
router.delete("/:id", asyncHandler(DiaryController.remove));

export default router;
