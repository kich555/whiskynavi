import { getApiV2AdminBoardsPostHistory } from "@/apis/generated/api";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BoardManagementHistoryPage from "./page";

vi.mock("@/apis/generated/api", () => ({ getApiV2AdminBoardsPostHistory: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getAuthToken: vi.fn(async () => "admin-token") }));
vi.mock("@/apis/mutator", () => ({
  withToken: (token: string) => ({ headers: { Authorization: `Bearer ${token}` } }),
}));

describe("관리기록 서버 조회", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApiV2AdminBoardsPostHistory).mockResolvedValue({
      data: { content: [], page: { totalElements: 50 } },
      status: 200,
      headers: new Headers(),
    });
  });

  it("생성된 관리자 API에 인증·정확한 작성자 필터·0부터 시작하는 페이지를 전달한다", async () => {
    await BoardManagementHistoryPage({
      searchParams: Promise.resolve({ mode: "posts", authorId: "12", deletedBy: "3", page: "2", limit: "10" }),
    });
    expect(getApiV2AdminBoardsPostHistory).toHaveBeenCalledWith(
      expect.objectContaining({ view: "ALL", authorId: 12, deletedBy: undefined, page: 1, size: 10 }),
      { headers: { Authorization: "Bearer admin-token" } },
    );
  });

  it("조회 실패를 빈 기록으로 바꾸지 않고 오류 경계에 전달한다", async () => {
    vi.mocked(getApiV2AdminBoardsPostHistory).mockRejectedValue(new Error("API unavailable"));
    await expect(BoardManagementHistoryPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("API unavailable");
  });
});
