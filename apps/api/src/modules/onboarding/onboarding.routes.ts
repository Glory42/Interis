import { Router } from "express";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { OnboardingController } from "./onboarding.controller";

const router = Router();

router.use(requireAuth);

router.get("/titles", asyncHandler(OnboardingController.getTitles));
router.post("/taste", asyncHandler(OnboardingController.saveTaste));
router.post("/complete", asyncHandler(OnboardingController.complete));

export default router;
