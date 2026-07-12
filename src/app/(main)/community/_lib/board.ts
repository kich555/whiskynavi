import { getApiBoards, type UserBoardResponse } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { COMMUNITY_BOARD_ID } from "./constants";

/**
 * 사용자용 게시판 단건 조회 API가 없어 목록 API를 크게 가져와 COMMUNITY_BOARD_ID로 찾는다.
 */
export async function getCommunityBoard(token: string | undefined): Promise<UserBoardResponse | undefined> {
  try {
    const res = await getApiBoards({ page: 0, size: 100 }, withToken(token));
    return res.data.content?.find((b) => b.id === COMMUNITY_BOARD_ID);
  } catch (error) {
    console.error("커뮤니티 게시판 조회에 실패했습니다.", error);
    return undefined;
  }
}
