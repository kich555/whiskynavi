import { callRefreshApiSingleFlight } from "@/apis/refresh-token";
import { AUTH_SESSION_COOKIE_NAMES, AUTH_SESSION_MAX_AGE_SEC } from "@/lib/auth-constants";
import { getAccessTokenRoles, shouldRefreshAuthToken } from "@/lib/auth-token";
import { decode, encode } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function getSessionCookie(request: NextRequest) {
  return AUTH_SESSION_COOKIE_NAMES.map((name) => ({
    name,
    value: request.cookies.get(name)?.value,
  })).find((cookie) => cookie.value);
}

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const secret = process.env.NEXTAUTH_SECRET;

  if (!sessionCookie?.value || !secret) {
    return NextResponse.next();
  }

  let decoded: Awaited<ReturnType<typeof decode>>;
  try {
    decoded = await decode({ token: sessionCookie.value, secret });
  } catch {
    const response = NextResponse.next();
    response.cookies.delete(sessionCookie.name);
    return response;
  }

  if (
    !decoded ||
    !shouldRefreshAuthToken({
      accessToken: decoded.accessToken,
      refreshToken: decoded.refreshToken,
    }) ||
    typeof decoded.refreshToken !== "string"
  ) {
    return NextResponse.next();
  }

  const result = await callRefreshApiSingleFlight(decoded.refreshToken);
  if (result.status !== "success") {
    return NextResponse.next();
  }

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

  // 현재 RSC 렌더도 새 JWT를 읽도록 요청 쿠키를 갱신하고, 브라우저 저장용 응답 쿠키도 같이 내려보낸다.
  request.cookies.set(sessionCookie.name, encodedSessionToken);

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  response.cookies.set(sessionCookie.name, encodedSessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: sessionCookie.name.startsWith("__Secure-"),
    maxAge: AUTH_SESSION_MAX_AGE_SEC,
  });

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
