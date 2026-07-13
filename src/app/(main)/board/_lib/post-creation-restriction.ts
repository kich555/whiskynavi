import type { UserSelfResponse } from "@/apis/generated/api";

export interface ActivePostCreationRestriction {
  reason: string;
  startAt: string;
  endAt: string;
}

export function getActivePostCreationRestriction(
  user: UserSelfResponse | null | undefined,
  now = new Date(),
): ActivePostCreationRestriction | null {
  if (
    !user?.isPostCreationRestricted ||
    !user.postCreationRestrictionReason ||
    !user.postCreationRestrictionStartAt ||
    !user.postCreationRestrictionEndAt
  ) {
    return null;
  }

  const startAt = new Date(user.postCreationRestrictionStartAt);
  const endAt = new Date(user.postCreationRestrictionEndAt);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) return null;
  if (startAt > now || endAt <= now) return null;

  return {
    reason: user.postCreationRestrictionReason,
    startAt: user.postCreationRestrictionStartAt,
    endAt: user.postCreationRestrictionEndAt,
  };
}
