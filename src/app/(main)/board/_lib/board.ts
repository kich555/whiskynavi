import {
  getApiBoardsBoardid,
  type GetApiBoardsBoardidPostsSearchType,
  type UserBoardResponse,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";

/**
 * 게시판 라우트로 단건 조회해 활성 글타입을 함께 가져온다.
 */
export async function getBoard(slug: string, token: string | undefined): Promise<UserBoardResponse | undefined> {
  const res = await getApiBoardsBoardid(slug, withToken(token));
  return res.data;
}

export interface BoardPostSearch {
  searchType?: GetApiBoardsBoardidPostsSearchType;
  keyword?: string;
}

/**
 * 게시글 목록 URL의 검색 조건을 API에서 허용하는 제목/작성자 검색으로 정규화한다.
 */
export function resolveBoardPostSearch(searchType?: string, keyword?: string): BoardPostSearch {
  const normalizedKeyword = keyword?.trim();
  if (!normalizedKeyword) return {};

  return {
    searchType: searchType === "AUTHOR" ? "AUTHOR" : "TITLE",
    keyword: normalizedKeyword,
  };
}
