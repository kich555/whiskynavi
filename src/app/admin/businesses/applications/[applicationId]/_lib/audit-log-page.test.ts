import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAuditLogPage } from "./audit-log-page";

const mocks = vi.hoisted(() => ({
  fetchAuditLogs: vi.fn(),
  supportsParams: true,
}));

vi.mock("@/apis/generated/api", () => ({
  getApiAdminBusinessesApplicationsApplicationidAuditLogs: mocks.fetchAuditLogs,
  getGetApiAdminBusinessesApplicationsApplicationidAuditLogsUrl: (...args: unknown[]) =>
    mocks.supportsParams && args.length >= 2 ? "/api/admin/applications/1/audit-logs?size=100" : "/api/audit-logs",
}));

vi.mock("@/apis/mutator", () => ({
  withToken: (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined),
}));

describe("getAuditLogPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.supportsParams = true;
  });

  it("PR #208 생성 함수에는 pageable params 뒤에 RequestInit을 전달한다", async () => {
    mocks.fetchAuditLogs.mockResolvedValue({
      data: { content: [{ id: 1 }], page: { totalElements: 12 } },
    });

    await expect(getAuditLogPage(1, "admin-token")).resolves.toEqual({
      content: [{ id: 1 }],
      page: { totalElements: 12 },
    });
    expect(mocks.fetchAuditLogs).toHaveBeenCalledWith(
      1,
      { page: 0, size: 100, sort: ["id,desc"] },
      { headers: { Authorization: "Bearer admin-token" } },
    );
  });

  it("구 생성 함수의 배열 응답을 Page 형태로 정규화한다", async () => {
    mocks.supportsParams = false;
    mocks.fetchAuditLogs.mockResolvedValue({ data: [{ id: 2 }] });

    await expect(getAuditLogPage(2, "admin-token")).resolves.toEqual({
      content: [{ id: 2 }],
      page: { number: 0, size: 1, totalElements: 1, totalPages: 1 },
    });
    expect(mocks.fetchAuditLogs).toHaveBeenCalledWith(2, {
      headers: { Authorization: "Bearer admin-token" },
    });
  });
});
