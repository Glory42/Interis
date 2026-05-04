import type { CreateDiaryDto, UpdateDiaryDto } from "./dto/diary.dto";
import { DiaryReadService } from "./services/diary-read.service";
import { DiaryWriteService } from "./services/diary-write.service";

export class DiaryService {
  static async create(userId: string, input: CreateDiaryDto) {
    return DiaryWriteService.create(userId, input);
  }

  static async findAllByUser(userId: string) {
    return DiaryReadService.findAllByUser(userId);
  }

  static async findOne(entryId: string, userId: string) {
    return DiaryReadService.findOne(entryId, userId);
  }

  static async update(entryId: string, userId: string, input: UpdateDiaryDto) {
    return DiaryWriteService.update(entryId, userId, input);
  }

  static async delete(entryId: string, userId: string) {
    return DiaryWriteService.delete(entryId, userId);
  }
}
