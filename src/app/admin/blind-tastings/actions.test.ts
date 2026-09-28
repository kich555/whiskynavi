import { ApiError } from "@/apis/errors";
import * as api from "@/apis/generated/blind-tasting";
import { getServerSession } from "next-auth";
import { beforeEach, expect, it, vi } from "vitest";
import { loadNotice, loadOverview, runOperation, searchBottles } from "./actions";
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/apis/generated/api", () => ({ getApiV2AdminBottles: vi.fn() }));
vi.mock("@/apis/generated/blind-tasting", () => ({
  btAdminNotices: vi.fn(),
  btAdminAuto: vi.fn(),
  btAdminCreateNotice: vi.fn(),
  btAdminRestrict: vi.fn(),
  btAdminNotice: vi.fn(),
  btAdminNoticeSamples: vi.fn(),
  btAdminSampleReviews: vi.fn(),
  btAdminReviewStatus: vi.fn(),
  btAdminSummary: vi.fn(),
  btAdminManual: vi.fn(),
  btAdminCatalog: vi.fn(),
}));
const key = "12345678-1234-1234-1234-123456789012";
const response = <T>(data: T) => ({ data, status: 200 as const, headers: new Headers() });
function form(values: Record<string, string | string[]>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) for (const x of Array.isArray(v) ? v : [v]) f.append(k, x);
  return f;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue({ accessToken: "test-token", user: { roles: ["ROLE_ADMIN"] } });
});
it.each([null, { accessToken: "token", user: { roles: ["ROLE_USER"] } }])(
  "조회·변경·보틀 검색마다 관리자 인증을 검사한다",
  async (session) => {
    vi.mocked(getServerSession).mockResolvedValue(session);
    expect((await loadOverview("notices")).success).toBe(false);
    expect((await loadNotice(1, "reviews")).success).toBe(false);
    expect((await runOperation("auto", 1, 0, key, form({ targetTotalPerUser: "3" }))).success).toBe(false);
    expect((await searchBottles("review", "test")).success).toBe(false);
    expect(api.btAdminNotices).not.toHaveBeenCalled();
    expect(api.btAdminAuto).not.toHaveBeenCalled();
    expect(api.btAdminNotice).not.toHaveBeenCalled();
    expect(api.btAdminCatalog).not.toHaveBeenCalled();
  },
);
it("자동 배분은 목표 총개수·현재 버전·같은 요청 키를 전달한다", async () => {
  vi.mocked(api.btAdminAuto).mockResolvedValue(response({ id: 7, resultJson: '{"allocated":2}' }));
  const f = form({ targetTotalPerUser: "3" });
  expect(await runOperation("auto", 1, 4, key, f)).toMatchObject({ success: true, resultJson: '{"allocated":2}' });
  await runOperation("auto", 1, 4, key, f);
  expect(api.btAdminAuto).toHaveBeenLastCalledWith(
    1,
    { targetTotalPerUser: 3, expectedVersion: 4 },
    expect.objectContaining({
      headers: { Authorization: "Bearer test-token", "Idempotency-Key": key },
      cache: "no-store",
    }),
  );
});
it("모집 일시를 한국 시간에서 UTC로 변환하고 신청 승인 상태를 보내지 않는다", async () => {
  vi.mocked(api.btAdminCreateNotice).mockResolvedValue(response({ id: 1 }));
  await runOperation(
    "createNotice",
    undefined,
    undefined,
    key,
    form({
      title: "테스트",
      description: "모집",
      applyOpenAt: "2026-10-01T09:00",
      applyCloseAt: "2026-10-02T09:00",
      reviewDeadlineAt: "2026-10-10T09:00",
    }),
  );
  expect(api.btAdminCreateNotice).toHaveBeenCalledWith(
    {
      title: "테스트",
      description: "모집",
      applyOpenAt: "2026-10-01T00:00:00.000Z",
      applyCloseAt: "2026-10-02T00:00:00.000Z",
      reviewDeadlineAt: "2026-10-10T00:00:00.000Z",
    },
    expect.anything(),
  );
});
it("샘플 복수 선택과 사유를 그대로 전달한다", async () => {
  vi.mocked(api.btAdminManual).mockResolvedValue(response([]));
  await runOperation(
    "manual",
    1,
    9,
    key,
    form({ applicationId: "15", noticeSampleIds: ["2", "3"], reason: "운영 배분" }),
  );
  expect(api.btAdminManual).toHaveBeenCalledWith(
    1,
    { applicationId: 15, noticeSampleIds: [2, 3], expectedVersion: 9, reason: "운영 배분" },
    expect.anything(),
  );
});
it("버전 충돌을 성공이나 빈 목록으로 숨기지 않는다", async () => {
  vi.mocked(api.btAdminAuto).mockRejectedValue(
    new ApiError(409, JSON.stringify({ message: "다른 관리자가 변경했습니다." })),
  );
  expect(await runOperation("auto", 1, 0, key, form({ targetTotalPerUser: "3" }))).toMatchObject({
    success: false,
    conflict: true,
    error: "다른 관리자가 변경했습니다.",
  });
  vi.mocked(api.btAdminNotices).mockRejectedValue(new Error("offline"));
  expect((await loadOverview("notices")).success).toBe(false);
});
it("현재 버전·대상·요청 키가 없으면 변경하지 않는다", async () => {
  for (const args of [
    [1, undefined, key],
    [NaN, 0, key],
    [1, 0, "bad"],
  ] as const) {
    expect((await runOperation("auto", args[0], args[1], args[2], form({ targetTotalPerUser: "3" }))).success).toBe(
      false,
    );
  }
  expect(api.btAdminAuto).not.toHaveBeenCalled();
});
it("샘플별 필터는 백엔드 계약으로 전달하고 JSON 원문을 재해석하지 않는다", async () => {
  const raw = ' {"comment":"<script>alert(1)</script>","x":1.000} ';
  vi.mocked(api.btAdminNotice).mockResolvedValue(response({ id: 1 }));
  vi.mocked(api.btAdminNoticeSamples).mockResolvedValue(response([{ id: 2 }]));
  vi.mocked(api.btAdminSampleReviews).mockResolvedValue(response([{ review: { id: 3, answersJson: raw } }]));
  vi.mocked(api.btAdminReviewStatus).mockResolvedValue(response([]));
  vi.mocked(api.btAdminSummary).mockResolvedValue(response({}));
  const r = await loadNotice(1, "reviews", undefined, undefined, "test", "LATE_PRE_REVEAL", "false");
  expect(api.btAdminSampleReviews).toHaveBeenCalledWith(
    1,
    2,
    { keyword: "test", timing: "LATE_PRE_REVEAL", hidden: false },
    expect.anything(),
  );
  expect(r.success && r.kind === "reviews" && r.reviews[0].review?.answersJson).toBe(raw);
});
