import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useServerClock } from "./useServerClock";

describe("useServerClock", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("동기화 전에는 로컬 시계(Date.now())로 폴백한다", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})), // 응답이 오지 않는 상태를 흉내낸다
    );

    const { result } = renderHook(() => useServerClock());

    expect(result.current.isSynced).toBe(false);
    expect(result.current.getNow()).toBeCloseTo(Date.now(), -2);
  });

  it("서버 시각과 오차가 있으면 동기화 후 서버 기준으로 보정한다", async () => {
    const serverNow = Date.now() + 10 * 60 * 1000; // 서버가 로컬보다 10분 앞서 있는 상황
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ now: serverNow }),
      }),
    );

    const { result } = renderHook(() => useServerClock());

    await waitFor(() => expect(result.current.isSynced).toBe(true));

    expect(result.current.getNow()).toBeCloseTo(serverNow, -3);
  });

  it("동기화 실패 시에도 로컬 시계로 계속 동작한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network error")),
    );

    const { result } = renderHook(() => useServerClock());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isSynced).toBe(false);
    expect(result.current.getNow()).toBeCloseTo(Date.now(), -2);
  });
});
