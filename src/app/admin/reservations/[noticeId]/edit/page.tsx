import {
  type AdminBottleReservationNoticeResponse,
  getApiAdminBottlesReservationsNoticesNoticeid,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { isReservationNoticeClosed } from "../../_lib/noticeStatus";
import NoticeEditContent from "./_components/NoticeEditContent";

interface NoticeEditPageProps {
  params: Promise<{ noticeId: string }>;
}

export default async function NoticeEditPage({ params }: NoticeEditPageProps) {
  const { noticeId } = await params;
  const token = await getAuthToken();

  let notice: AdminBottleReservationNoticeResponse | undefined;
  try {
    const res = await getApiAdminBottlesReservationsNoticesNoticeid(Number(noticeId), withToken(token));
    notice = res.data;
  } catch {
    notFound();
  }

  if (!notice) notFound();
  if (isReservationNoticeClosed(notice)) {
    redirect(`/admin/reservations/${notice.id ?? Number(noticeId)}`);
  }

  return <NoticeEditContent notice={notice} />;
}
