import { getApiBottlesReservationsNotices } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { unstable_cache } from "next/cache";
import { NOTICES_LIST_CACHE_TAG } from "./cacheTags";

const cachedFetchActiveNotices = unstable_cache(
  async (token?: string) => {
    const res = await getApiBottlesReservationsNotices({ page: 0, size: 100 }, withToken(token));
    return res.data;
  },
  [NOTICES_LIST_CACHE_TAG],
  { revalidate: 30, tags: [NOTICES_LIST_CACHE_TAG] },
);

// token은 unstable_cache 밖(headers() 접근 가능한 곳)에서 미리 가져와 인자로 전달해야 한다.
export function fetchActiveNotices(token?: string) {
  return cachedFetchActiveNotices(token);
}
