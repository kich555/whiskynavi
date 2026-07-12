import { getApiBoards, type UserBoardResponse } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";

/**
 * 사용자용 게시판 단건 조회 API가 없어 목록 API를 크게 가져와 slug로 찾는다.
 */
export async function getBoard(slug: string, token: string | undefined): Promise<UserBoardResponse | undefined> {
  try {
    const res = await getApiBoards({ page: 0, size: 100 }, withToken(token));
    console.log(
      "res",
      res.data.content?.map((i) => i.postTypes),
    );
    return res.data.content?.find((b) => b.slug === slug);
  } catch (error) {
    console.error("게시판 조회에 실패했습니다.", error);
    return undefined;
  }
}
