import type { AuthUserRow } from "../repositories/auth-users.repository";
import type { AuthUser } from "../types/auth.types";

export const toAuthUser = (row: AuthUserRow): AuthUser => ({
  id: row.id,
  email: row.email,
  username: row.username,
  displayUsername: row.displayUsername,
  name: row.name,
  emailVerified: row.emailVerified,
  image: row.image,
});
