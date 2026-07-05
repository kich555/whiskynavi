import { getApiBottlesReservationsNoticesNoticeid } from "@/apis/generated/api";
import { unstable_cache } from "next/cache";
import { noticeCacheTag } from "./cacheTags";

export function fetchNoticeDetail(id: number) {
  return unstable_cache(
    async () => {
      const res = await getApiBottlesReservationsNoticesNoticeid(id);
      return res.data;
    },
    [`reservation-notice-${id}`],
    { revalidate: 30, tags: [noticeCacheTag(id)] },
  )();
}
