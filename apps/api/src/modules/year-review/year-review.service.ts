import { YearReviewReadService } from "./services/year-review-read.service";

export class YearReviewService {
  static async read(username: string, year: number) {
    return YearReviewReadService.read(username, year);
  }
}
