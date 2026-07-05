import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/server-time", () => {
  it("현재 서버 시각을 JSON으로 반환한다", async () => {
    const before = Date.now();
    const res = await GET();
    const after = Date.now();
    const body = (await res.json()) as { now: number };

    expect(res.status).toBe(200);
    expect(body.now).toBeGreaterThanOrEqual(before);
    expect(body.now).toBeLessThanOrEqual(after);
  });
});
