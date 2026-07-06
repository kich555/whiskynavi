import { getApiBottlesReservationsNoticesNoticeid } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { unstable_cache } from "next/cache";
import { noticeCacheTag } from "./cacheTags";

// token은 unstable_cache 밖(headers() 접근 가능한 곳)에서 미리 가져와 인자로 전달해야 한다.
export function fetchNoticeDetail(id: number, token?: string) {
  return unstable_cache(
    async (token?: string) => {
      const res = await getApiBottlesReservationsNoticesNoticeid(id, withToken(token));
      return res.data;
    },
    [`reservation-notice-${id}`],
    { revalidate: 30, tags: [noticeCacheTag(id)] },
  )(token);
}
