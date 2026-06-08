import { redirect } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import BusinessPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("BusinessPage", () => {
  it("비즈니스 관리 기본 진입을 통계 페이지로 보낸다", () => {
    BusinessPage();

    expect(redirect).toHaveBeenCalledWith("/business/statistics");
  });
});
