import { getApiAdminBusinessesMembersUserid } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { notFound } from "next/navigation";
import BusinessMemberDetailContent from "./_components/BusinessMemberDetailContent";

interface BusinessMemberDetailPageProps {
  params: Promise<{ userId: string }>;
}

export default async function BusinessMemberDetailPage({
  params,
}: BusinessMemberDetailPageProps) {
  const { userId } = await params;
  const token = await getAuthToken();

  try {
    const res = await getApiAdminBusinessesMembersUserid(
      Number(userId),
      withToken(token),
    );

    return <BusinessMemberDetailContent member={res.data} />;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("[404]")) {
      notFound();
    }
    throw error;
  }
}
