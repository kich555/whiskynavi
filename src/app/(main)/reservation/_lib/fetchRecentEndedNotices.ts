import { getApiBottlesReservationsNoticesRecentEnded } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { unstable_cache } from "next/cache";
import { NOTICES_RECENT_ENDED_CACHE_TAG } from "./cacheTags";

export const fetchRecentEndedNotices = unstable_cache(
  async () => {
    const token = await getAuthToken();
    const res = await getApiBottlesReservationsNoticesRecentEnded(withToken(token));
    return res.data;
  },
  [NOTICES_RECENT_ENDED_CACHE_TAG],
  { revalidate: 300, tags: [NOTICES_RECENT_ENDED_CACHE_TAG] },
);
