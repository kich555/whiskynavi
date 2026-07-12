import { getApiBoardsBoardidAnnouncementsAnnouncementid } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { authOptions, getAuthToken } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import AnnouncementDetailContent from "../../../_components/AnnouncementDetailContent";
import { NEWS_BOARD_ID } from "../../../_lib/constants";

interface AnnouncementDetailPageProps {
  params: Promise<{ announcementId: string }>;
}

export default async function AnnouncementDetailPage({ params }: AnnouncementDetailPageProps) {
  const { announcementId } = await params;
  const id = Number(announcementId);

  const [session] = await Promise.all([getServerSession(authOptions)]);

  const currentUserId = session?.user?.id ? Number(session.user.id) : undefined;

  const res = await getApiBoardsBoardidAnnouncementsAnnouncementid(
    NEWS_BOARD_ID,
    id,
    withToken((await getAuthToken()) ?? undefined),
  ).catch(() => null);

  if (!res) {
    notFound();
  }

  return (
    <AnnouncementDetailContent announcement={res.data} boardId={NEWS_BOARD_ID} currentUserId={currentUserId} />
  );
}
