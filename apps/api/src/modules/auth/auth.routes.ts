import { createHonoApp } from "../../infrastructure/http/hono-context.types";
import { AuthController } from "./auth.controller";
import { requireAuth } from "../../commons/middlewares/requireAuth.hono";

const app = createHonoApp({ bodyLimitBytes: 20 * 1024 });

app.post("/sign-up/email", AuthController.signUp);
app.post("/sign-in/email", AuthController.signIn);
app.post("/sign-out", AuthController.signOut);
app.post("/forgot-password", AuthController.forgotPassword);
app.post("/reset-password", AuthController.resetPassword);

app.post("/update-user", requireAuth, AuthController.updateUser);
app.delete("/account", requireAuth, AuthController.deleteAccount);
app.post("/change-password", requireAuth, AuthController.changePassword);
app.post("/change-email", requireAuth, AuthController.changeEmail);
app.post("/security-question", requireAuth, AuthController.setSecurityQuestion);

export default app;
