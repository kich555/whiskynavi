import { AuthError } from "./errors";

import { authLogger } from "./auth-logger";
import { ApiError, NetworkError } from "./errors";
import { refreshSessionToken } from "./refresh-token";

/**
 * 인증 실패 처리.
 * - 서버: redirect("/sign-in") — Next.js가 내부적으로 throw하여 로그인 페이지로 이동
 * - 클라이언트: AuthError throw — SessionErrorHandler가 signOut 처리
 */
async function handleAuthFailure(): Promise<never> {
  if (typeof window === "undefined") {
    const { redirect } = await import("next/navigation");
    redirect("/sign-in");
  }
  throw new AuthError();
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.whiskynavi.com";

function parseResponse(res: Response): Promise<unknown> | undefined {
  if (res.status === 204 || res.status === 205) {
    return undefined;
  }
  const ctype = res.headers.get("content-type") ?? "";
  return ctype.includes("application/json") ? res.json() : res.text();
}

async function extractErrorDetail(res: Response): Promise<string> {
  try {
    const ctype = res.headers.get("content-type") ?? "";
    if (ctype.includes("application/json")) {
      const json = await res.json();
      return typeof json === "string" ? json : JSON.stringify(json);
    }
    return await res.text();
  } catch {
    return "";
  }
}

/**
 * Orval custom mutator.
 * - 401: 세션 기반 토큰 갱신 시도 후 재요청. 실패 시 AuthError throw.
 * - 403: ApiError throw (권한 부족, 로그아웃하지 않음)
 * - 5xx: ApiError throw
 * - 네트워크 에러: NetworkError throw
 *
 * 토큰 갱신은 refreshSessionToken()을 통해 수행.
 * - 서버: JWT 쿠키에서 refreshToken 추출 → callRefreshApi (raw fetch)
 * - 클라이언트: getSession() → jwt callback 트리거 → 최신 accessToken 반환
 */
export const customFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
  const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;

  let res: Response;
  try {
    res = await fetch(fullUrl, {
      ...options,
      cache: "no-store",
    });
  } catch {
    throw new NetworkError();
  }

  // 401: 토큰 만료 → 세션 기반 refresh 시도 후 재요청
  if (res.status === 401) {
    authLogger.warn(`401 received: ${fullUrl}`);
    const newToken = await refreshSessionToken();

    if (newToken) {
      authLogger.warn(`refresh succeeded, retrying: ${fullUrl}`);
      const retryHeaders = new Headers(options.headers);
      retryHeaders.set("Authorization", `Bearer ${newToken}`);

      let retryRes: Response;
      try {
        retryRes = await fetch(fullUrl, {
          ...options,
          headers: retryHeaders,
          cache: "no-store",
        });
      } catch {
        throw new NetworkError();
      }

      if (retryRes.ok) {
        const data = await parseResponse(retryRes);
        return { data, status: retryRes.status, headers: retryRes.headers } as T;
      }

      // 재시도도 401/403이면 인증 완전 실패
      if (retryRes.status === 401 || retryRes.status === 403) {
        authLogger.error(`retry failed (${retryRes.status}): ${fullUrl} → redirect`);
        await handleAuthFailure();
      }

      const detail = await extractErrorDetail(retryRes);
      throw new ApiError(retryRes.status, detail);
    }

    // refresh 실패 → 로그인 페이지로
    authLogger.error("refresh returned null → redirect");
    await handleAuthFailure();
  }

  if (res.status === 403) {
    if (typeof window !== "undefined") {
      const { signOut } = await import("next-auth/react");
      await signOut({ callbackUrl: "/sign-in" });
    }
    throw new AuthError();
  }

  if (!res.ok) {
    const detail = await extractErrorDetail(res);
    authLogger.error(`non-401 error (${res.status}): ${fullUrl} — detail: ${detail}`);
    throw new ApiError(res.status, detail);
  }

  const data = await parseResponse(res);
  return { data, status: res.status, headers: res.headers } as T;
};

export default customFetch;

/**
 * 서버 컴포넌트에서 인증 토큰을 RequestInit headers로 변환하는 헬퍼.
 * @param token - Bearer access token. undefined이면 인증 헤더 없이 요청.
 * @returns RequestInit with Authorization header, or undefined if no token
 *
 * @example
 * const token = await getAuthToken();
 * const res = await listUsers(params, withToken(token));
 */
export const withToken = (token?: string): RequestInit | undefined => {
  if (!token) return undefined;
  const value = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  return { headers: { Authorization: value } };
};
