"use client";

import { SessionProvider, signOut, useSession } from "next-auth/react";
import type { ReactNode } from "react";
import { useEffect } from "react";

type Props = {
  children: ReactNode;
};

/**
 * session.error가 "RefreshTokenError"이면 자동 signOut.
 * "RefreshTemporaryError"는 일시적 장애이므로 무시 — 다음 요청에서 재시도됨.
 */
function SessionErrorHandler() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.error === "RefreshTokenError") {
      signOut({ callbackUrl: "/sign-in" });
    }
  }, [session?.error]);

  return null;
}

/**
 * 세션 refetch 간격 (초).
 * jwt callback의 TOKEN_REFRESH_INTERVAL(20분)보다 짧게 설정하여
 * worst-case에서도 백엔드 TTL(30분) 내에 토큰이 갱신되도록 보장.
 */
const REFETCH_INTERVAL_SEC = 5 * 60;

export function AuthProvider({ children }: Props) {
  return (
    <SessionProvider
      refetchInterval={REFETCH_INTERVAL_SEC}
      refetchOnWindowFocus={process.env.NODE_ENV !== "development"}
    >
      <SessionErrorHandler />
      {children}
    </SessionProvider>
  );
}
