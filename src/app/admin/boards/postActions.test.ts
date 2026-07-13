import { postApiAdminBoardsBoardidPostsPostidDelete } from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteBoardPostAction } from "./actions";

vi.mock("@/apis/generated/api", () => ({
  postApiAdminBoardsBoardidPostsPostidDelete: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockedGetAuthToken = vi.mocked(getAuthToken);
const mockedDeletePost = vi.mocked(postApiAdminBoardsBoardidPostsPostidDelete);
const mockedRevalidatePath = vi.mocked(revalidatePath);

describe("board post admin actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuthToken.mockResolvedValue("admin-token");
    mockedDeletePost.mockResolvedValue({ data: true, status: 200, headers: new Headers() });
  });

  it("rejects deletion without an auth token", async () => {
    mockedGetAuthToken.mockResolvedValue(undefined);

    await expect(deleteBoardPostAction(1, 10, "운영 정책 위반", "community")).resolves.toEqual({
      success: false,
      error: "인증이 필요합니다.",
    });
    expect(mockedDeletePost).not.toHaveBeenCalled();
  });

  it("rejects a blank deletion reason", async () => {
    await expect(deleteBoardPostAction(1, 10, "   ", "community")).resolves.toEqual({
      success: false,
      error: "삭제 사유를 입력해 주세요.",
    });
    expect(mockedDeletePost).not.toHaveBeenCalled();
  });

  it("deletes a post with the normalized reason and revalidates affected pages", async () => {
    await expect(deleteBoardPostAction(1, 10, "  운영 정책 위반  ", "community")).resolves.toEqual({
      success: true,
    });

    expect(mockedDeletePost).toHaveBeenCalledWith(
      1,
      10,
      { deleteReason: "운영 정책 위반" },
      { headers: { Authorization: "Bearer admin-token" } },
    );
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/boards");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/board/community");
  });
});
