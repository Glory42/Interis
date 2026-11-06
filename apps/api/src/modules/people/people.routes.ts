import { Router } from "express";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { PeopleController } from "./people.controller";

const router = Router();

router.get("/:role/:slug", asyncHandler(PeopleController.getByRoleAndSlug));
router.get("/:role/:slug/credits", asyncHandler(PeopleController.getCredits));

export default router;
