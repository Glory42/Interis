import { AuthUsersRepository } from "../../auth/repositories/auth-users.repository";

export const resolveUserId = async (username: string | undefined): Promise<string | undefined> => {
  if (!username) return undefined;
  const userRow = await AuthUsersRepository.findByUsername(username);
  return userRow?.id;
};
