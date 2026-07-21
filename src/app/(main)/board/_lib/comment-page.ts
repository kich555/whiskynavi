import type { CommentResponse } from "@/apis/generated/api";
import {
  getApiBoardsBoardidPostsPostidComments,
  getGetApiBoardsBoardidPostsPostidCommentsUrl,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";

export interface CommentPageData {
  comments: CommentResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface CommentPageParams {
  cursor?: string;
  size?: number;
}

type CommentPageEnvelope = {
  data: CommentPageData | CommentResponse[];
};

type CommentPageFetcher = (
  boardId: string,
  postId: number,
  params: CommentPageParams,
  options?: RequestInit,
) => Promise<CommentPageEnvelope>;

type LegacyCommentFetcher = (boardId: string, postId: number, options?: RequestInit) => Promise<CommentPageEnvelope>;

type CommentPageUrlBuilder = (boardId: string, postId: number, params?: CommentPageParams) => string;

const DEFAULT_COMMENT_PAGE_SIZE = 20;

/**
 * PR #208 OpenAPI의 cursor params와 RequestInit 위치를 한 곳에서 고정합니다.
 * 구 생성 클라이언트가 남아 있는 개발 브랜치에서는 첫 페이지 배열 응답도
 * 임시로 정규화하며, API 재생성 후에는 cursor 계약을 그대로 사용합니다.
 */
export async function getCommentPage(
  boardId: string,
  postId: number,
  cursor?: string,
  token?: string,
): Promise<CommentPageData> {
  const params: CommentPageParams = {
    cursor,
    size: DEFAULT_COMMENT_PAGE_SIZE,
  };
  const options = token ? withToken(token) : undefined;
  const urlBuilder = getGetApiBoardsBoardidPostsPostidCommentsUrl as unknown as CommentPageUrlBuilder;
  const generatedUrl = urlBuilder(boardId, postId, params);
  const supportsCursorParams = generatedUrl.includes("size=");

  const response = supportsCursorParams
    ? await (getApiBoardsBoardidPostsPostidComments as unknown as CommentPageFetcher)(boardId, postId, params, options)
    : await (getApiBoardsBoardidPostsPostidComments as unknown as LegacyCommentFetcher)(boardId, postId, options);

  if (Array.isArray(response.data)) {
    return {
      comments: response.data,
      nextCursor: null,
      hasMore: false,
    };
  }

  return {
    comments: response.data.comments ?? [],
    nextCursor: response.data.nextCursor ?? null,
    hasMore: response.data.hasMore ?? false,
  };
}
