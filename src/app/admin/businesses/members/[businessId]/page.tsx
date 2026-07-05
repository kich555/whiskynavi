import { getApiAdminBusinessesBusinessesBusinessid } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { notFound } from "next/navigation";
import BusinessMemberDetailContent from "./_components/BusinessMemberDetailContent";

const DOCUMENT_DOWNLOAD_VALID_MS = 9 * 60 * 1000 + 30 * 1000;

interface BusinessMemberDetailPageProps {
  params: Promise<{ businessId: string }>;
}

export default async function BusinessMemberDetailPage({ params }: BusinessMemberDetailPageProps) {
  const { businessId } = await params;
  const token = await getAuthToken();

  let res;
  try {
    res = await getApiAdminBusinessesBusinessesBusinessid(Number(businessId), withToken(token));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("[404]")) {
      notFound();
    }
    throw error;
  }

  // 사업자등록증 다운로드 URL은 상세 조회 API 응답 직후부터 9분 30초 동안 유효한 것으로 안내한다.
  const hasDocumentDownloadUrl = Boolean(res.data.documentDownloadUrl);

  return (
    <BusinessMemberDetailContent
      member={res.data}
      documentDownloadInitialRemainingSeconds={hasDocumentDownloadUrl ? DOCUMENT_DOWNLOAD_VALID_MS / 1000 : undefined}
    />
  );
}
