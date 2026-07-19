import { createHonoApp } from "../../infrastructure/http/hono-context.types";
import { ModerationController } from "./moderation.controller";
import { requireAuth } from "../../commons/middlewares/requireAuth.hono";

const app = createHonoApp();

app.use(requireAuth);

app.get("/blocked", ModerationController.getBlocked);
app.get("/muted", ModerationController.getMuted);
app.get("/state/:username", ModerationController.getRelationshipState);
app.post("/block/:username", ModerationController.block);
app.delete("/block/:username", ModerationController.unblock);
app.post("/mute/:username", ModerationController.mute);
app.delete("/mute/:username", ModerationController.unmute);

export default app;
