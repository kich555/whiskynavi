import { postApiBoardsBoardidPosts } from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPostAction } from "./actions";

vi.mock("@/apis/generated/api", () => ({
  postApiBoardsBoardidPosts: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
  getAuthToken: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

const mockedCreatePost = vi.mocked(postApiBoardsBoardidPosts);
const mockedGetAuthToken = vi.mocked(getAuthToken);
const mockedRevalidatePath = vi.mocked(revalidatePath);

function createValidFormData() {
  const formData = new FormData();
  formData.set("postTypeCode", "general");
  formData.set("title", "게시글 제목");
  formData.set("content", "<p>게시글 내용</p>");
  return formData;
}

describe("createPostAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuthToken.mockResolvedValue("access-token");
    mockedCreatePost.mockResolvedValue({
      data: { id: 1 },
      status: 200,
      headers: new Headers(),
    });
  });

  it("게시글 등록 후 성공 상태를 반환하고 목록을 재검증한다", async () => {
    await expect(createPostAction("community", null, createValidFormData())).resolves.toEqual({ success: true });

    expect(mockedCreatePost).toHaveBeenCalledWith(
      "community",
      expect.objectContaining({
        postTypeCode: "general",
        title: "게시글 제목",
      }),
      { headers: { Authorization: "Bearer access-token" } },
    );
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/board/community");
  });
});
