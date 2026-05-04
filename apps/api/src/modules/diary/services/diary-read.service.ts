import { DiaryRepository } from "../repositories/diary.repository";

export class DiaryReadService {
  static async findAllByUser(userId: string) {
    return DiaryRepository.findAllByUser(userId);
  }

  static async findOne(entryId: string, userId: string) {
    return DiaryRepository.findOneByIdAndUser(entryId, userId);
  }
}
