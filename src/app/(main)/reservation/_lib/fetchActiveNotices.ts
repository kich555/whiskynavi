import { getApiBottlesReservationsNotices } from "@/apis/generated/api";
import { cacheLife, cacheTag } from "next/cache";
import { NOTICES_LIST_CACHE_TAG } from "./cacheTags";

export async function fetchActiveNotices() {
  "use cache";
  cacheTag(NOTICES_LIST_CACHE_TAG);
  cacheLife({ stale: 30, revalidate: 30, expire: 60 });

  const res = await getApiBottlesReservationsNotices({ page: 0, size: 100 });
  return res.data;
}
