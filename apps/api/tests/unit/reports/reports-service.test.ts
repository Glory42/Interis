import { describe, expect, it, mock } from "bun:test";

const reviewFindByIdMock = mock((_reviewId: string) =>
  Promise.resolve<{ review: { content: string } } | null>(null),
);
const postFindByIdMock = mock((_postId: string) =>
  Promise.resolve<{ content: string } | null>(null),
);
const insertMock = mock((_input: {
  reporterId: string;
  targetType: string;
  targetId: string;
  contentSnapshot: string;
  reason: string;
  details?: string;
}) => Promise.resolve());

mock.module("../../../src/modules/reviews/reviews.service", () => ({
  ReviewsService: { findById: reviewFindByIdMock },
}));
mock.module("../../../src/modules/posts/posts.service", () => ({
  PostsService: { findById: postFindByIdMock },
}));
mock.module("../../../src/modules/reports/repositories/reports.repository", () => ({
  ReportsRepository: { insert: insertMock },
}));

const { ReportsService } = await import("../../../src/modules/reports/reports.service");

describe("ReportsService.submitReport (unit)", () => {
  it("returns 404 when the target review does not exist", async () => {
    reviewFindByIdMock.mockResolvedValueOnce(null);

    const result = await ReportsService.submitReport(
      "reporter-id",
      "review",
      "missing-review",
      "spam",
    );

    expect(result).toEqual({ error: "Review not found", status: 404 });
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the target post does not exist", async () => {
    postFindByIdMock.mockResolvedValueOnce(null);

    const result = await ReportsService.submitReport(
      "reporter-id",
      "post",
      "missing-post",
      "spam",
    );

    expect(result).toEqual({ error: "Post not found", status: 404 });
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("truncates an overlong content snapshot to 2000 characters", async () => {
    insertMock.mockClear();
    const longContent = "x".repeat(3000);
    postFindByIdMock.mockResolvedValueOnce({ content: longContent });

    const result = await ReportsService.submitReport(
      "reporter-id",
      "post",
      "post-1",
      "inappropriate",
      "note",
    );

    expect(result).toEqual({ success: true });
    const call = insertMock.mock.calls[0]?.[0] as { contentSnapshot: string };
    expect(call.contentSnapshot).toHaveLength(2000);
  });

  it("omits empty details rather than storing an empty string", async () => {
    insertMock.mockClear();
    postFindByIdMock.mockResolvedValueOnce({ content: "short" });

    await ReportsService.submitReport("reporter-id", "post", "post-2", "other", "");

    const call = insertMock.mock.calls[0]?.[0] as { details?: string };
    expect(call.details).toBeUndefined();
  });
});
