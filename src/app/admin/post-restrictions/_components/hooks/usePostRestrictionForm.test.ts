import { renderHook, act } from "@testing-library/react";
import { toast } from "sonner";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { usePostRestrictionForm } from "./usePostRestrictionForm";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const mockToast = vi.mocked(toast);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("usePostRestrictionForm", () => {
  describe("초기 상태", () => {
    it("initialData가 없으면 빈 사용자와 기본 기간(시작=현재 분, 종료=+1시간)으로 시작한다", () => {
      const before = Date.now();
      const { result } = renderHook(() => usePostRestrictionForm({ onSubmit: vi.fn() }));

      expect(result.current.formState.userId).toBe("");
      expect(result.current.formState.name).toBe("");
      expect(result.current.formState.reason).toBe("");

      const startAt = new Date(result.current.formState.startAt ?? "").getTime();
      const endAt = new Date(result.current.formState.endAt ?? "").getTime();
      // defaultPeriod가 setSeconds(0,0)으로 초/밀리초를 버리므로 before 기준 최대 1분 earlier 허용
      expect(startAt).toBeGreaterThanOrEqual(before - 60_000);
      expect(startAt).toBeLessThanOrEqual(before + 60_000);
      expect(endAt - startAt).toBe(60 * 60 * 1000);
    });

    it("initialData가 있으면 해당 값으로 시작한다", () => {
      const initialData = {
        userId: 42,
        name: "테스트유저",
        reason: "기존 사유",
        startAt: "2026-01-01T00:00:00.000Z",
        endAt: "2026-01-02T00:00:00.000Z",
      };
      const { result } = renderHook(() =>
        usePostRestrictionForm({ initialData, onSubmit: vi.fn() }),
      );

      expect(result.current.formState.userId).toBe("42");
      expect(result.current.formState.name).toBe("테스트유저");
      expect(result.current.formState.reason).toBe("기존 사유");
      expect(result.current.formState.startAt).toBe("2026-01-01T00:00:00.000Z");
      expect(result.current.formState.endAt).toBe("2026-01-02T00:00:00.000Z");
    });
  });

  describe("reducer 액션", () => {
    it("SET_USER가 사용자 ID와 이름을 설정한다", () => {
      const { result } = renderHook(() => usePostRestrictionForm({ onSubmit: vi.fn() }));

      act(() => {
        result.current.dispatch({
          type: "SET_USER",
          payload: { userId: "99", name: "새유저" },
        });
      });

      expect(result.current.formState.userId).toBe("99");
      expect(result.current.formState.name).toBe("새유저");
    });

    it("CLEAR_USER가 사용자 정보만 비우고 다른 필드는 유지한다", () => {
      const { result } = renderHook(() =>
        usePostRestrictionForm({
          initialData: { userId: 1, name: "유저", reason: "사유", startAt: "s", endAt: "e" },
          onSubmit: vi.fn(),
        }),
      );

      act(() => {
        result.current.dispatch({ type: "CLEAR_USER" });
      });

      expect(result.current.formState.userId).toBe("");
      expect(result.current.formState.name).toBe("");
      expect(result.current.formState.reason).toBe("사유");
    });

    it("SET_REASON이 사유를 갱신한다", () => {
      const { result } = renderHook(() => usePostRestrictionForm({ onSubmit: vi.fn() }));

      act(() => {
        result.current.dispatch({ type: "SET_REASON", payload: "새 사유" });
      });

      expect(result.current.formState.reason).toBe("새 사유");
    });

    it("SET_START_DATE / SET_END_DATE가 날짜를 갱신한다", () => {
      const { result } = renderHook(() => usePostRestrictionForm({ onSubmit: vi.fn() }));

      act(() => {
        result.current.dispatch({ type: "SET_START_DATE", payload: "2026-03-01T00:00:00.000Z" });
        result.current.dispatch({ type: "SET_END_DATE", payload: "2026-03-02T00:00:00.000Z" });
      });

      expect(result.current.formState.startAt).toBe("2026-03-01T00:00:00.000Z");
      expect(result.current.formState.endAt).toBe("2026-03-02T00:00:00.000Z");
    });
  });

  describe("handleSubmit 검증", () => {
    it("사용자가 없으면 onSubmit을 호출하지 않고 toast.error를 띄운다", async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() => usePostRestrictionForm({ onSubmit }));

      await act(async () => {
        result.current.handleSubmit();
      });

      expect(mockToast.error).toHaveBeenCalledWith("사용자를 선택해주세요.");
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("사유가 비어 있으면 toast.error를 띄운다", async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() => usePostRestrictionForm({ onSubmit }));

      act(() => {
        result.current.dispatch({ type: "SET_USER", payload: { userId: "1", name: "유저" } });
      });

      await act(async () => {
        result.current.handleSubmit();
      });

      expect(mockToast.error).toHaveBeenCalledWith("사유를 입력해주세요.");
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("검증 통과 시 onSubmit에 정규화된 데이터를 전달한다", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => usePostRestrictionForm({ onSubmit }));

      act(() => {
        result.current.dispatch({ type: "SET_USER", payload: { userId: "7", name: "유저" } });
        result.current.dispatch({ type: "SET_REASON", payload: "사유" });
        result.current.dispatch({ type: "SET_START_DATE", payload: "2026-01-01T00:00:00.000Z" });
        result.current.dispatch({ type: "SET_END_DATE", payload: "2026-01-02T00:00:00.000Z" });
      });

      await act(async () => {
        result.current.handleSubmit();
      });

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith({
        userId: 7,
        name: "유저",
        reason: "사유",
        startAt: "2026-01-01T00:00:00.000Z",
        endAt: "2026-01-02T00:00:00.000Z",
      });
    });
  });
});
