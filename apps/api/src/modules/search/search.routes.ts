import { Router } from "express";
import { SearchController } from "./search.controller";
import { asyncHandler } from "../../commons/utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(SearchController.searchTitles));

export default router;
