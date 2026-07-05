import { getApiBottlesReservationsNoticesNoticeid } from "@/apis/generated/api";
import { cacheLife, cacheTag } from "next/cache";
import { noticeCacheTag } from "./cacheTags";

export async function fetchNoticeDetail(id: number) {
  "use cache";
  cacheTag(noticeCacheTag(id));
  cacheLife({ stale: 30, revalidate: 30, expire: 60 });

  const res = await getApiBottlesReservationsNoticesNoticeid(id);
  return res.data;
}
