import { getApiBottlesReservationsNoticesRecentEnded } from "@/apis/generated/api";
import { unstable_cache } from "next/cache";
import { NOTICES_RECENT_ENDED_CACHE_TAG } from "./cacheTags";

export const fetchRecentEndedNotices = unstable_cache(
  async () => {
    const res = await getApiBottlesReservationsNoticesRecentEnded();
    return res.data;
  },
  [NOTICES_RECENT_ENDED_CACHE_TAG],
  { revalidate: 300, tags: [NOTICES_RECENT_ENDED_CACHE_TAG] },
);
