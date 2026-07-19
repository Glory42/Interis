import { createHonoApp } from "./hono-context.types";

const healthApp = createHonoApp();

healthApp.get("/", (c) => c.json({ status: "ok", message: "Interis API is alive" }));

export default healthApp;
