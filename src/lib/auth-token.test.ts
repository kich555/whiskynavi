import { describe, expect, it } from "vitest";
import { getAccessTokenRoles, shouldRefreshAuthToken } from "./auth-token";

function createJwt(expSeconds: number, roles?: string[]) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ exp: expSeconds, roles })).toString("base64url");
  return `${header}.${payload}.`;
}

describe("shouldRefreshAuthToken", () => {
  it("accessToken exp가 이미 지났으면 갱신 대상으로 본다", () => {
    const accessToken = createJwt(Math.floor((Date.now() - 1000) / 1000));

    expect(
      shouldRefreshAuthToken({
        accessToken,
        refreshToken: "refresh-token",
      }),
    ).toBe(true);
  });

  it("accessToken exp가 남아 있으면 만료 임박이어도 갱신하지 않는다", () => {
    const accessToken = createJwt(Math.floor((Date.now() + 30 * 1000) / 1000));

    expect(
      shouldRefreshAuthToken({
        accessToken,
        refreshToken: "refresh-token",
      }),
    ).toBe(false);
  });

  it("accessToken exp를 읽을 수 없으면 자동 갱신하지 않는다", () => {
    expect(
      shouldRefreshAuthToken({
        accessToken: "opaque-access-token",
        refreshToken: "refresh-token",
      }),
    ).toBe(false);
  });

  it("갱신된 accessToken의 roles claim을 세션 동기화에 사용할 수 있다", () => {
    const accessToken = createJwt(Math.floor((Date.now() + 30 * 1000) / 1000), [
      "ROLE_USER",
      "ROLE_BUSINESS",
    ]);

    expect(getAccessTokenRoles(accessToken)).toEqual(["ROLE_USER", "ROLE_BUSINESS"]);
    expect(getAccessTokenRoles("opaque-access-token")).toBeNull();
  });
});
