import { normalizeThemeId, type ThemeId } from "../constants/theme.constants";
import type { UpdateProfileDto } from "../dto/users.dto";
import { UsersRepository } from "../repositories/users.repository";

export class UsersProfileService {
  static async findByUsername(username: string) {
    const result = await UsersRepository.findProfileByUsername(username);

    if (!result) {
      return null;
    }

    return {
      ...result,
      themeId: normalizeThemeId(result.themeId),
    };
  }

  static async findById(userId: string) {
    const result = await UsersRepository.findProfileById(userId);

    if (!result) {
      return null;
    }

    return {
      ...result,
      themeId: normalizeThemeId(result.themeId),
    };
  }

  static async updateProfile(userId: string, input: UpdateProfileDto) {
    return UsersRepository.updateProfile(userId, input);
  }

  static async updateTheme(userId: string, themeId: ThemeId) {
    const updated = await UsersRepository.updateTheme(userId, themeId);
    if (!updated) {
      return null;
    }

    return {
      themeId: normalizeThemeId(updated.themeId),
    };
  }
}
