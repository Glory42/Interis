import type { CreateDiaryDto, UpdateDiaryDto } from "./dto/diary.dto";
import { DiaryRepository } from "./repositories/diary.repository";
import { DiaryWriteService } from "./services/diary-write.service";

export class DiaryService {
  static async create(userId: string, input: CreateDiaryDto) {
    return DiaryWriteService.create(userId, input);
  }

  static async findAllByUser(userId: string) {
    return DiaryRepository.findAllByUser(userId);
  }

  static async findOne(entryId: string, userId: string) {
    return DiaryRepository.findOneByIdAndUser(entryId, userId);
  }

  static async update(entryId: string, userId: string, input: UpdateDiaryDto) {
    return DiaryWriteService.update(entryId, userId, input);
  }

  static async delete(entryId: string, userId: string) {
    return DiaryWriteService.delete(entryId, userId);
  }

  static async deleteById(entryId: string) {
    return DiaryWriteService.deleteById(entryId);
  }

  static async listAllForAdmin(
    filters: { userId?: string; movieId?: number },
    limit: number,
    offset: number,
  ) {
    return DiaryRepository.listAllForAdmin(filters, limit, offset);
  }
}
