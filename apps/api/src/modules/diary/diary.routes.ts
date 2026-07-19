import { createHonoApp } from "../../infrastructure/http/hono-context.types";
import { DiaryController } from "./diary.controller";
import { requireAuth } from "../../commons/middlewares/requireAuth.hono";

const app = createHonoApp();

app.use(requireAuth);

app.get("/", DiaryController.getMyDiary);
app.post("/", DiaryController.create);
app.put("/:id", DiaryController.update);
app.delete("/:id", DiaryController.remove);

export default app;
