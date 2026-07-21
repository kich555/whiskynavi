import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAuditLogPage } from "./audit-log-page";

const fetchMock = vi.fn();

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function request(): { url: URL; init: RequestInit } {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return { url: new URL(url), init };
}

describe("getAuditLogPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("구 generated 상태에서도 20건을 넘는 감사로그를 위해 size=100 Page 요청을 실제 전송한다", async () => {
    const content = Array.from({ length: 25 }, (_, index) => ({ id: index + 1 }));
    fetchMock.mockResolvedValue(
      jsonResponse({ content, page: { number: 0, size: 100, totalElements: 25, totalPages: 1 } }),
    );

    await expect(getAuditLogPage(7, "admin-token")).resolves.toEqual({
      content,
      page: { number: 0, size: 100, totalElements: 25, totalPages: 1 },
    });

    const { url, init } = request();
    expect(url.pathname).toBe("/api/admin/businesses/applications/7/audit-logs");
    expect(url.searchParams.get("page")).toBe("0");
    expect(url.searchParams.get("size")).toBe("100");
    expect(url.searchParams.getAll("sort")).toEqual(["id,desc"]);
    expect(init.method).toBe("GET");
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer admin-token");
  });

  it("구 서버의 배열 응답을 Page 형태로 정규화한다", async () => {
    fetchMock.mockResolvedValue(jsonResponse([{ id: 2 }]));

    await expect(getAuditLogPage(2, "admin-token")).resolves.toEqual({
      content: [{ id: 2 }],
      page: { number: 0, size: 1, totalElements: 1, totalPages: 1 },
    });
  });
});
