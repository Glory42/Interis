import { z } from "zod";
import { apiRequest, encodeSegment, type QueryRequestOptions } from "./client";
import {
  likeReviewResponseSchema,
  reviewCommentSchema,
  reviewDetailSchema,
  type ReviewComment,
  type ReviewDetail,
} from "@/types/reviews";

const reviewPath = (reviewId: string) => `/api/reviews/${encodeSegment(reviewId)}`;

export const getReviewDetail = async (
  username: string,
  reviewId: string,
  options: QueryRequestOptions = {},
): Promise<ReviewDetail> => {
  const response = await apiRequest<unknown>(
    `/api/users/${encodeSegment(username)}/reviews/${encodeSegment(reviewId)}`,
    { signal: options.signal },
  );
  return reviewDetailSchema.parse(response);
};

export const getReviewComments = async (
  reviewId: string,
  options: QueryRequestOptions = {},
): Promise<ReviewComment[]> => {
  const response = await apiRequest<unknown>(`${reviewPath(reviewId)}/comments`, {
    signal: options.signal,
  });
  return z.array(reviewCommentSchema).parse(response);
};

export const addReviewComment = async (reviewId: string, content: string): Promise<void> => {
  await apiRequest<unknown, { content: string }>(`${reviewPath(reviewId)}/comments`, {
    method: "POST",
    body: { content: content.trim() },
  });
};

export const setReviewLiked = async (reviewId: string, liked: boolean): Promise<boolean> => {
  const response = await apiRequest<unknown>(`${reviewPath(reviewId)}/like`, {
    method: liked ? "POST" : "DELETE",
  });
  return likeReviewResponseSchema.parse(response).liked;
};
