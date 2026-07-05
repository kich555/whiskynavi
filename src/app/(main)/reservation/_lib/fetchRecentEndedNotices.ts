import { getApiBottlesReservationsNoticesRecentEnded } from "@/apis/generated/api";
import { cacheLife, cacheTag } from "next/cache";
import { NOTICES_RECENT_ENDED_CACHE_TAG } from "./cacheTags";

export async function fetchRecentEndedNotices() {
  "use cache";
  cacheTag(NOTICES_RECENT_ENDED_CACHE_TAG);
  cacheLife("minutes");

  const res = await getApiBottlesReservationsNoticesRecentEnded();
  return res.data;
}
