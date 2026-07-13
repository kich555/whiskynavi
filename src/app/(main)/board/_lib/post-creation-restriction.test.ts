import { describe, expect, it } from "vitest";
import { getActivePostCreationRestriction } from "./post-creation-restriction";

const now = new Date("2026-07-13T12:00:00.000Z");

describe("getActivePostCreationRestriction", () => {
  it("현재 효력이 있는 제한의 사유와 기간을 반환한다", () => {
    expect(
      getActivePostCreationRestriction(
        {
          isPostCreationRestricted: true,
          postCreationRestrictionReason: "도배",
          postCreationRestrictionStartAt: "2026-07-13T11:00:00.000Z",
          postCreationRestrictionEndAt: "2026-07-13T13:00:00.000Z",
        },
        now,
      ),
    ).toEqual({
      reason: "도배",
      startAt: "2026-07-13T11:00:00.000Z",
      endAt: "2026-07-13T13:00:00.000Z",
    });
  });

  it("시작 전이거나 만료된 제한은 반환하지 않는다", () => {
    const base = {
      isPostCreationRestricted: true,
      postCreationRestrictionReason: "도배",
      postCreationRestrictionStartAt: "2026-07-13T13:00:00.000Z",
      postCreationRestrictionEndAt: "2026-07-13T14:00:00.000Z",
    };
    expect(getActivePostCreationRestriction(base, now)).toBeNull();
    expect(
      getActivePostCreationRestriction(
        {
          ...base,
          postCreationRestrictionStartAt: "2026-07-13T10:00:00.000Z",
          postCreationRestrictionEndAt: "2026-07-13T12:00:00.000Z",
        },
        now,
      ),
    ).toBeNull();
  });
});
