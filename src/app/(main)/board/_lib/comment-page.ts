import type { CommentResponse } from "@/apis/generated/api";
import customFetch, { withToken } from "@/apis/mutator";

export interface CommentPageData {
  comments: CommentResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

type CommentPageEnvelope = {
  data: CommentPageData | CommentResponse[];
};

const DEFAULT_COMMENT_PAGE_SIZE = 20;

/**
 * PR #208의 cursor 계약을 생성 클라이언트 버전과 무관하게 호출합니다.
 * 운영 OpenAPI가 아직 구버전이어도 cursor/size를 실제 URL에 포함하고,
 * 응답만 신·구 서버 형태 모두 정규화합니다.
 */
export async function getCommentPage(
  boardId: string,
  postId: number,
  cursor?: string,
  token?: string,
): Promise<CommentPageData> {
  const params = new URLSearchParams({ size: String(DEFAULT_COMMENT_PAGE_SIZE) });
  if (cursor) params.set("cursor", cursor);
  const url = `/api/boards/${encodeURIComponent(boardId)}/posts/${postId}/comments?${params.toString()}`;
  const response = await customFetch<CommentPageEnvelope>(url, {
    ...(withToken(token) ?? {}),
    method: "GET",
  });

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
