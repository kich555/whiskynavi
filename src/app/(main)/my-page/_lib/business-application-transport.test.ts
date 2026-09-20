import { refreshSessionToken } from "@/apis/refresh-token";
import { getSession } from "next-auth/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { submitBusinessApplication } from "./submit-business-application";

vi.mock("next-auth/react", () => ({ getSession: vi.fn(), signOut: vi.fn() }));
vi.mock("@/apis/refresh-token", () => ({ refreshSessionToken: vi.fn() }));

const fetchMock = vi.fn<typeof fetch>();
const createForm = () => {
  const form = new FormData();
  form.set("businessName", "테스트 사업장");
  form.set("pickupAddress", "서울");
  form.set("contact", "010-1234-5678");
  form.set("businessRegistrationNumber", "123-45-67890");
  form.set("businessType", "HOUSEHOLD");
  form.set("openingDate", "2026-01-01");
  form.set("representativeName", "홍길동");
  form.set("document", new File([new Uint8Array(10 * 1024 * 1024)], "business.pdf", { type: "application/pdf" }));
  return form;
};

describe("사업자 신청의 브라우저 직접 전송", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(getSession).mockResolvedValue({ user: { id: "test-user" }, accessToken: "token", expires: "2099-01-01" });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("10MB 파일을 Server Action 없이 백엔드의 multipart 계약으로 전송한다", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { headers: { "Content-Type": "application/json" } }));
    await expect(submitBusinessApplication(createForm())).resolves.toEqual({ success: true });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];
    const target = new URL(String(url));
    expect(target.origin).toBe(process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.whiskynavi.com");
    expect(target.pathname).toBe("/api/users/businesses/applications");
    expect(target.searchParams.get("businessName")).toBe("테스트 사업장");
    expect(target.searchParams.get("businessType")).toBe("HOUSEHOLD");
    expect(options?.method).toBe("POST");
    const headers = new Headers(options?.headers);
    expect(headers.get("Authorization")).toBe("Bearer token");
    expect(headers.has("Next-Action")).toBe(false);
    expect(headers.has("Content-Type")).toBe(false); // 브라우저가 multipart boundary를 설정한다.
    expect((options?.body as FormData).get("document")).toMatchObject({ size: 10 * 1024 * 1024, name: "business.pdf" });
  });

  it("401 응답이면 기존 토큰 갱신 흐름으로 같은 파일을 재전송한다", async () => {
    vi.mocked(refreshSessionToken).mockResolvedValue("renewed-token");
    fetchMock.mockResolvedValueOnce(new Response("", { status: 401 }));
    fetchMock.mockResolvedValueOnce(new Response("{}", { headers: { "Content-Type": "application/json" } }));

    await expect(submitBusinessApplication(createForm())).resolves.toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const retry = fetchMock.mock.calls[1][1];
    expect(new Headers(retry?.headers).get("Authorization")).toBe("Bearer renewed-token");
    expect(retry?.body).toBe(fetchMock.mock.calls[0][1]?.body);
  });

  it("전송 중 네트워크 오류를 폼의 오류 상태로 반환한다", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(submitBusinessApplication(createForm())).resolves.toEqual({
      success: false,
      error: "네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.",
    });
  });
});
