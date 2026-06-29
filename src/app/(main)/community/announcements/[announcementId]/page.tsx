import { getApiBoardsBoardidAnnouncementsAnnouncementid } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { authOptions } from "@/lib/auth";
import { getAuthToken } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { COMMUNITY_BOARD_ID } from "../../_lib/constants";
import AnnouncementDetailContent from "./_components/AnnouncementDetailContent";

interface AnnouncementDetailPageProps {
  params: Promise<{ announcementId: string }>;
}

export default async function AnnouncementDetailPage({ params }: AnnouncementDetailPageProps) {
  const { announcementId } = await params;
  const id = Number(announcementId);

  const [session] = await Promise.all([getServerSession(authOptions)]);

  const currentUserId = session?.user?.id ? Number(session.user.id) : undefined;

  let announcement;
  try {
    const res = await getApiBoardsBoardidAnnouncementsAnnouncementid(
      COMMUNITY_BOARD_ID,
      id,
      withToken((await getAuthToken()) ?? undefined),
    );
    announcement = res.data;
  } catch {
    notFound();
  }

  return <AnnouncementDetailContent announcement={announcement} currentUserId={currentUserId} />;
}