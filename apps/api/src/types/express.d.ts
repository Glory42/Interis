import type { AuthUser, RequestSession } from "../modules/auth/types/auth.types";

declare global {
  namespace Express {
    interface Request {
      user: AuthUser;
      session: RequestSession;
    }
  }
}
