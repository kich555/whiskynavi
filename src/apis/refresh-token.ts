import { AUTH_SESSION_COOKIE_NAMES, AUTH_SESSION_MAX_AGE_SEC } from "@/lib/auth-constants";
import { getAccessTokenRoles } from "@/lib/auth-token";
import { decode, encode } from "next-auth/jwt";
import { authLogger } from "./auth-logger";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.whiskynavi.com";

function stripBearerPrefix(token: string): string {
  return token.replace(/^Bearer\s+/i, "");
}

/**
 * refresh API 호출 결과.
 * - success: 새 accessToken + refreshToken
 * - auth_failed: refresh token이 만료/무효 (401/400) → 세션 파기 정당
 * - server_error: 서버 장애/네트워크 에러 (5xx, 연결 실패) → 세션 보존
 */
export type RefreshResult =
  | { status: "success"; accessToken: string; refreshToken: string }
  | { status: "auth_failed" }
  | { status: "server_error" };

/**
 * 백엔드 refresh API를 raw fetch로 호출한다.
 * customFetch를 사용하면 재귀가 발생하므로 반드시 raw fetch 사용.
 */
export async function callRefreshApi(refreshToken: string): Promise<RefreshResult> {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (res.ok) {
      const data = await res.json();
      const newAccessToken = data.accessToken;
      const newRefreshToken = data.refreshToken ?? refreshToken;
      if (typeof newAccessToken === "string" && newAccessToken) {
        return {
          status: "success",
          accessToken: stripBearerPrefix(newAccessToken),
          refreshToken: typeof newRefreshToken === "string" ? stripBearerPrefix(newRefreshToken) : refreshToken,
        };
      }
      authLogger.error("callRefreshApi: 200 OK but no accessToken");
      return { status: "server_error" };
    }

    authLogger.error(`callRefreshApi: backend responded ${res.status}`);
    if (res.status === 401 || res.status === 400 || res.status === 403) {
      return { status: "auth_failed" };
    }

    return { status: "server_error" };
  } catch (e) {
    authLogger.error("callRefreshApi: unexpected error", e);
    return { status: "server_error" };
  }
}

/**
 * 같은 refreshToken에 대한 동시 refresh 요청을 하나로 합친다.
 * 백엔드가 refreshToken rotation을 수행할 때 중복 호출이 발생하면
 * 첫 번째 요청은 성공하고 두 번째 요청은 기존 refreshToken 무효로 실패할 수 있다.
 */
const refreshApiPromises = new Map<string, Promise<RefreshResult>>();

export function callRefreshApiSingleFlight(refreshToken: string): Promise<RefreshResult> {
  const pending = refreshApiPromises.get(refreshToken);
  if (pending) return pending;

  const promise = callRefreshApi(refreshToken).finally(() => {
    refreshApiPromises.delete(refreshToken);
  });
  refreshApiPromises.set(refreshToken, promise);
  return promise;
}

/**
 * 401 발생 시 세션에서 refreshToken을 꺼내 refresh API 호출.
 * 성공하면 새 accessToken 반환, 실패하면 null.
 *
 * 동시 요청의 중복 refresh를 방지하기 위해 singleton promise 패턴 사용.
 */
let refreshPromise: Promise<string | null> | null = null;

export async function refreshSessionToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = doRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function doRefresh(): Promise<string | null> {
  if (typeof window === "undefined") {
    return refreshOnServer();
  }
  return refreshOnClient();
}

async function refreshOnServer(): Promise<string | null> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    authLogger.error("refreshOnServer: NEXTAUTH_SECRET missing");
    return null;
  }

  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();

    // next-auth v4 쿠키명 — v5 마이그레이션 시 변경 필요
    const sessionCookie = AUTH_SESSION_COOKIE_NAMES.map((name) => ({
      name,
      value: cookieStore.get(name)?.value,
    })).find((cookie) => cookie.value);

    if (!sessionCookie?.value) {
      authLogger.error("refreshOnServer: no session cookie found");
      return null;
    }

    const decoded = await decode({ token: sessionCookie.value, secret });
    if (!decoded?.refreshToken || typeof decoded.refreshToken !== "string") {
      authLogger.error("refreshOnServer: no refreshToken in JWT");
      return null;
    }

    const result = await callRefreshApiSingleFlight(decoded.refreshToken);
    if (result.status === "success") {
      try {
        const encodedSessionToken = await encode({
          token: {
            ...decoded,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            roles: getAccessTokenRoles(result.accessToken) ?? decoded.roles,
            tokenIssuedAt: Date.now(),
            error: undefined,
          },
          secret,
          maxAge: AUTH_SESSION_MAX_AGE_SEC,
        });

        // 401 재시도용 토큰뿐 아니라 이후 요청에서 사용할 NextAuth JWT 쿠키도 함께 갱신한다.
        cookieStore.set(sessionCookie.name, encodedSessionToken, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: sessionCookie.name.startsWith("__Secure-"),
          maxAge: AUTH_SESSION_MAX_AGE_SEC,
        });
      } catch (e) {
        // Server Component 렌더 중에는 Next.js가 쿠키 수정을 막을 수 있다.
        // 저장 실패를 refresh 실패로 바꾸면 customFetch가 로그인 화면으로 redirect하므로,
        // 현재 요청은 새 accessToken으로 계속 진행시키고 다음 세션 동기화에서 재시도한다.
        authLogger.warn(
          `refreshOnServer: session cookie save skipped (${e instanceof Error ? e.message : "unknown error"})`,
        );
      }
      authLogger.warn("refreshOnServer: refresh succeeded");
      return result.accessToken;
    }
    authLogger.error(`refreshOnServer: callRefreshApi → ${result.status}`);
    return null;
  } catch (e) {
    authLogger.error("refreshOnServer: unexpected error", e);
    return null;
  }
}

async function refreshOnClient(): Promise<string | null> {
  try {
    const { getSession } = await import("next-auth/react");
    // getSession은 NextAuth /api/auth/session을 호출하여
    // jwt callback을 트리거 → 만료된 토큰은 자동 갱신됨
    const session = await getSession();
    // jwt callback이 갱신한 최신 accessToken을 반환
    return session?.accessToken ?? null;
  } catch {
    return null;
  }
}
