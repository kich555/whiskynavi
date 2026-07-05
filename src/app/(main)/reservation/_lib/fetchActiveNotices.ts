import { getApiBottlesReservationsNotices } from "@/apis/generated/api";
import { unstable_cache } from "next/cache";
import { NOTICES_LIST_CACHE_TAG } from "./cacheTags";

export const fetchActiveNotices = unstable_cache(
  async () => {
    const res = await getApiBottlesReservationsNotices({ page: 0, size: 100 });
    return res.data;
  },
  [NOTICES_LIST_CACHE_TAG],
  { revalidate: 30, tags: [NOTICES_LIST_CACHE_TAG] },
);
