import { getApiBottlesReservationsNotices } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { unstable_cache } from "next/cache";
import { NOTICES_LIST_CACHE_TAG } from "./cacheTags";

export const fetchActiveNotices = unstable_cache(
  async () => {
    const token = await getAuthToken();
    const res = await getApiBottlesReservationsNotices({ page: 0, size: 100 }, withToken(token));
    return res.data;
  },
  [NOTICES_LIST_CACHE_TAG],
  { revalidate: 30, tags: [NOTICES_LIST_CACHE_TAG] },
);
