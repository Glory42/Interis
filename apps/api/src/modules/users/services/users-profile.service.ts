import { normalizeThemeId, type ThemeId } from "../constants/theme.constants";
import type { UpdateProfileDto } from "../dto/users.dto";
import { UsersProfileRepository } from "../repositories/users-profile.repository";

export class UsersProfileService {
  static async findByUsername(username: string) {
    const result = await UsersProfileRepository.findProfileByUsername(username);

    if (!result) {
      return null;
    }

    return {
      ...result,
      themeId: normalizeThemeId(result.themeId),
    };
  }

  static async findById(userId: string) {
    const result = await UsersProfileRepository.findProfileById(userId);

    if (!result) {
      return null;
    }

    return {
      ...result,
      themeId: normalizeThemeId(result.themeId),
    };
  }

  static async updateProfile(userId: string, input: UpdateProfileDto) {
    return UsersProfileRepository.updateProfile(userId, input);
  }

  static async updateTheme(userId: string, themeId: ThemeId) {
    const updated = await UsersProfileRepository.updateTheme(userId, themeId);
    if (!updated) {
      return null;
    }

    return {
      themeId: normalizeThemeId(updated.themeId),
    };
  }
}
