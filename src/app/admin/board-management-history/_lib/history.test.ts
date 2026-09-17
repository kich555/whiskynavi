import { describe, expect, it } from "vitest";
import {
  formatHistoryDate,
  historyDetailHref,
  historyHref,
  historyReturnFilters,
  historyStatus,
  normalizeHistoryFilters,
} from "./history";

describe("관리기록 검색과 이력 연결", () => {
  it("잘못된 페이지·건수·식별자를 API 호출 전에 정규화한다", () => {
    expect(
      normalizeHistoryFilters({ page: "-3", limit: "999", authorId: "1.2", deletedBy: "9007199254740992" }),
    ).toMatchObject({ page: "1", limit: "20", authorId: undefined, deletedBy: undefined });
    expect(normalizeHistoryFilters({ page: ["1", "2"], keyword: "  글 제목  " }).keyword).toBe("글 제목");
  });

  it("작성 이력으로 이동하면 관리자 삭제 필터를 해제한다", () => {
    expect(
      normalizeHistoryFilters({ mode: "posts", authorId: "12", deletedBy: "3", deletedByNickname: "관리자" }),
    ).toMatchObject({ authorId: "12", deletedBy: undefined, deletedByNickname: undefined });
  });

  it("상세를 보고 돌아와도 검색 조건과 페이지를 보존한다", () => {
    const filters = normalizeHistoryFilters({
      mode: "posts",
      status: "USER_DELETED",
      page: "3",
      limit: "10",
      authorId: "12",
      keyword: "위스키 & 리뷰",
    });
    const url = new URL(historyDetailHref(7, filters), "http://localhost");
    expect(historyReturnFilters(url.searchParams.get("returnTo")!)).toEqual(filters);
    expect(historyHref(historyReturnFilters("https://evil.example?next=//evil.example"))).toMatch(
      /^\/admin\/board-management-history\?/,
    );
  });

  it.each(["ACTIVE", "DELETED", "USER_DELETED", "ADMIN_DELETED", "UNKNOWN_DELETED"])(
    "작성 이력에서 %s 상태를 유지하고 관리자 삭제 탭에서는 제거한다",
    (status) => {
      expect(normalizeHistoryFilters({ mode: "posts", status }).status).toBe(status);
      expect(normalizeHistoryFilters({ mode: "deleted", status }).status).toBeUndefined();
    },
  );

  it("전체·잘못된 상태·중복 상태 파라미터는 필터를 적용하지 않는다", () => {
    for (const status of [undefined, "ALL", "INVALID", ["ACTIVE", "DELETED"]]) {
      expect(normalizeHistoryFilters({ mode: "posts", status }).status).toBeUndefined();
    }
  });

  it("조회 환경과 무관하게 한국 시각을 표시하고 알 수 없는 날짜·삭제 주체를 구분한다", () => {
    expect(formatHistoryDate("2026-09-17T14:30:00")).toBe(formatHistoryDate("2026-09-17T05:30:00Z"));
    expect(formatHistoryDate("invalid")).toBe("-");
    expect(historyStatus({ deleted: true, deletedByRole: "USER" })).toBe("작성자 삭제");
    expect(historyStatus({ deleted: true })).toBe("삭제 (주체 미상)");
  });
});
