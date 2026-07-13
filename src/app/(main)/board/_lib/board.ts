import { getApiBoardsBoardid, type UserBoardResponse } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";

/**
 * 게시판 라우트로 단건 조회해 활성 글타입을 함께 가져온다.
 */
export async function getBoard(slug: string, token: string | undefined): Promise<UserBoardResponse | undefined> {
  const res = await getApiBoardsBoardid(slug, withToken(token));
  return res.data;
}
