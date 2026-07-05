"use client";

import type { UserBottleReservationNoticePublicResponse } from "@/apis/generated/api";
import { useEffect, useState } from "react";
import { calculateTimeRemaining, getNoticeStatus, type NoticeStatus } from "./utils";
import { useServerClock } from "./useServerClock";

interface CountdownTimerResult {
  timeRemaining: string;
  status: NoticeStatus;
}

export function useCountdownTimer(notice: UserBottleReservationNoticePublicResponse): CountdownTimerResult {
  const { getNow, isSynced } = useServerClock();
  const [now, setNow] = useState(getNow);

  // string deps로 매 렌더 새 Date 객체 생성 방지 (rerender-dependencies)
  const startAt = notice.reservationStartAt;
  const endAt = notice.reservationEndAt;
  const status = getNoticeStatus(notice, now);

  // 서버 시각 동기화가 끝나면 로컬 시계 기준으로 잡았던 초기값을 즉시 보정한다.
  useEffect(() => {
    const syncNow = () => setNow(getNow());
    if (isSynced) syncNow();
  }, [isSynced, getNow]);

  useEffect(() => {
    if (status === "closed") return;
    const tick = () => setNow(getNow());
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [status, getNow]);

  const targetDateStr = status === "pending" ? startAt : endAt;
  const timeRemaining = targetDateStr ? calculateTimeRemaining(new Date(targetDateStr), now) : "";

  return { timeRemaining, status };
}
