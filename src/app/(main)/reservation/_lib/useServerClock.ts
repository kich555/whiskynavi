"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ServerClock {
  getNow: () => number;
  isSynced: boolean;
}

// 로컬 OS 시계(Date.now())는 사용자가 임의로 바꿀 수 있어 신뢰하지 않는다.
// 서버 시각을 한 번 받아온 뒤 모노토닉 타이머(performance.now())로 경과 시간을 더해서
// OS 시계 변경과 무관하게 서버 기준 현재 시각을 계산한다.
export function useServerClock(): ServerClock {
  const offsetRef = useRef<number | null>(null);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      try {
        const requestPerf = performance.now();
        const res = await fetch("/api/server-time", { cache: "no-store" });
        const { now: serverNow } = (await res.json()) as { now: number };
        const responsePerf = performance.now();
        // 왕복 지연의 절반을 요청 전송 시점의 서버 시각 보정값으로 사용한다.
        const estimatedServerNowAtRequest = serverNow - (responsePerf - requestPerf) / 2;

        if (!cancelled) {
          offsetRef.current = estimatedServerNowAtRequest - requestPerf;
          setIsSynced(true);
        }
      } catch {
        // 동기화에 실패하면 로컬 시계(Date.now())로 폴백한다.
      }
    }

    sync();
    return () => {
      cancelled = true;
    };
  }, []);

  const getNow = useCallback(() => {
    if (offsetRef.current === null) return Date.now();
    return performance.now() + offsetRef.current;
  }, []);

  return { getNow, isSynced };
}
