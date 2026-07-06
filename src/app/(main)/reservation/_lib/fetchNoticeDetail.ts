import { getApiBottlesReservationsNoticesNoticeid } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { unstable_cache } from "next/cache";
import { noticeCacheTag } from "./cacheTags";

export function fetchNoticeDetail(id: number) {
  return unstable_cache(
    async () => {
      const token = await getAuthToken();
      const res = await getApiBottlesReservationsNoticesNoticeid(id, withToken(token));
      return res.data;
    },
    [`reservation-notice-${id}`],
    { revalidate: 30, tags: [noticeCacheTag(id)] },
  )();
}
