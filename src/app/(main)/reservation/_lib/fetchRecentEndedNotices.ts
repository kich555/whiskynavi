import { getApiBottlesReservationsNoticesRecentEnded } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { unstable_cache } from "next/cache";
import { NOTICES_RECENT_ENDED_CACHE_TAG } from "./cacheTags";

const cachedFetchRecentEndedNotices = unstable_cache(
  async (token?: string) => {
    const res = await getApiBottlesReservationsNoticesRecentEnded(withToken(token));
    return res.data;
  },
  [NOTICES_RECENT_ENDED_CACHE_TAG],
  { revalidate: 300, tags: [NOTICES_RECENT_ENDED_CACHE_TAG] },
);

// token은 unstable_cache 밖(headers() 접근 가능한 곳)에서 미리 가져와 인자로 전달해야 한다.
export function fetchRecentEndedNotices(token?: string) {
  return cachedFetchRecentEndedNotices(token);
}
