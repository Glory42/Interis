import { createHonoApp } from "../../infrastructure/http/hono-context.types";
import { UploadsController } from "./uploads.controller";
import { requireAuth } from "../../commons/middlewares/requireAuth.hono";

const app = createHonoApp();

app.use(requireAuth);

app.post("/request", UploadsController.requestUpload);
app.post("/confirm", UploadsController.confirmUpload);

export default app;
