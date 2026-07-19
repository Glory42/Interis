import { createHonoApp } from "../../infrastructure/http/hono-context.types";
import { DataTransferController } from "./data-transfer.controller";
import { requireAuth } from "../../commons/middlewares/requireAuth.hono";

const app = createHonoApp({ bodyLimitBytes: 10 * 1024 * 1024 });

app.use(requireAuth);

app.get("/export", DataTransferController.export);
app.post("/import", DataTransferController.import);

export default app;
