import { btAdminBottleImage, btAdminExportDownload } from "@/apis/generated/blind-tasting";
import { getServerSession } from "next-auth";
import { beforeEach, expect, it, vi } from "vitest";
import { GET } from "./route";
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/apis/generated/blind-tasting", () => ({ btAdminExportDownload: vi.fn(), btAdminBottleImage: vi.fn() }));
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue({ accessToken: "token", user: { roles: ["ROLE_ADMIN"] } });
});
const call = (kind = "export", id = "1") =>
  GET(new Request("http://localhost"), { params: Promise.resolve({ kind, id }) });
it("미인증·비관리자는 파일 저장소에 접근하지 않는다", async () => {
  vi.mocked(getServerSession)
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce({ accessToken: "token", user: { roles: ["ROLE_USER"] } });
  expect((await call()).status).toBe(401);
  expect((await call("image")).status).toBe(403);
  expect(btAdminExportDownload).not.toHaveBeenCalled();
  expect(btAdminBottleImage).not.toHaveBeenCalled();
});
it("허용한 파일 종류와 양수 ID만 조회한다", async () => {
  expect((await call("arbitrary")).status).toBe(404);
  expect((await call("image", "../x")).status).toBe(404);
  expect(btAdminExportDownload).not.toHaveBeenCalled();
});
it("다운로드 파일은 비공개 캐시와 원본 바이트를 유지한다", async () => {
  vi.mocked(btAdminExportDownload).mockResolvedValue({
    status: 200,
    data: new Blob(["원문,통계"]),
    headers: new Headers({ "content-type": "text/csv" }),
  });
  const r = await call();
  expect(r.status).toBe(200);
  expect(r.headers.get("cache-control")).toBe("private, no-store");
  expect(r.headers.get("content-disposition")).toContain("attachment");
  expect(await r.text()).toBe("원문,통계");
});
