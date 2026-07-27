import { beforeEach, describe, expect, it, vi } from "vitest";

const callRefreshApiSingleFlightMock = vi.fn();
const decodeMock = vi.fn();
const encodeMock = vi.fn();

function createJwt(expSeconds: number, roles?: string[]) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ exp: expSeconds, roles })).toString("base64url");
  return `${header}.${payload}.`;
}

vi.mock("@/apis/refresh-token", () => ({
  callRefreshApiSingleFlight: callRefreshApiSingleFlightMock,
}));

vi.mock("next-auth/jwt", () => ({
  decode: decodeMock,
  encode: encodeMock,
}));

describe("proxy", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.NEXTAUTH_SECRET = "test-secret";
    decodeMock.mockResolvedValue({
      accessToken: createJwt(Math.floor((Date.now() - 1000) / 1000)),
      refreshToken: "old-refresh-token",
      tokenIssuedAt: Date.now(),
    });
    encodeMock.mockResolvedValue("new-session-token");
    callRefreshApiSingleFlightMock.mockResolvedValue({
      status: "success",
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
    });
  });

  it("페이지 요청 전에 refresh가 필요하면 요청 쿠키와 응답 쿠키를 새 JWT로 갱신한다", async () => {
    const refreshedAccessToken = createJwt(
      Math.floor((Date.now() + 60_000) / 1000),
      ["ROLE_USER", "ROLE_BUSINESS"],
    );
    callRefreshApiSingleFlightMock.mockResolvedValueOnce({
      status: "success",
      accessToken: refreshedAccessToken,
      refreshToken: "new-refresh-token",
    });

    const { proxy } = await import("./proxy");
    const requestCookieStore = new Map([["next-auth.session-token", "old-session-token"]]);
    const request = {
      headers: new Headers({
        Cookie: "next-auth.session-token=old-session-token",
      }),
      cookies: {
        get: (name: string) => {
          const value = requestCookieStore.get(name);
          return value ? { name, value } : undefined;
        },
        set: (name: string, value: string) => {
          requestCookieStore.set(name, value);
        },
      },
    } as never;

    expect(requestCookieStore.get("next-auth.session-token")).toBe("old-session-token");

    const response = await proxy(request);

    expect(callRefreshApiSingleFlightMock).toHaveBeenCalledWith("old-refresh-token");
    expect(encodeMock).toHaveBeenCalledWith({
      token: expect.objectContaining({
        accessToken: refreshedAccessToken,
        refreshToken: "new-refresh-token",
        roles: ["ROLE_USER", "ROLE_BUSINESS"],
        tokenIssuedAt: expect.any(Number),
        error: undefined,
      }),
      secret: "test-secret",
      maxAge: 30 * 24 * 60 * 60,
    });
    expect(requestCookieStore.get("next-auth.session-token")).toBe("new-session-token");
    expect(response.cookies.get("next-auth.session-token")?.value).toBe("new-session-token");
  });

  it("복호화할 수 없는 세션 쿠키는 refresh하지 않고 요청을 계속 진행한다", async () => {
    decodeMock.mockRejectedValueOnce(new Error("decryption operation failed"));

    const { proxy } = await import("./proxy");
    const request = {
      headers: new Headers({
        Cookie: "next-auth.session-token=stale-session-token",
      }),
      cookies: {
        get: (name: string) =>
          name === "next-auth.session-token" ? { name, value: "stale-session-token" } : undefined,
        set: vi.fn(),
      },
    } as never;

    const response = await proxy(request);

    expect(callRefreshApiSingleFlightMock).not.toHaveBeenCalled();
    expect(encodeMock).not.toHaveBeenCalled();
    expect(response.cookies.get("next-auth.session-token")?.value).toBe("");
  });
});
