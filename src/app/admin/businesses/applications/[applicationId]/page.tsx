import { getApiAdminBusinessesApplicationsApplicationid } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { notFound } from "next/navigation";
import BusinessApplicationDetailContent from "./_components/BusinessApplicationDetailContent";
import { getAuditLogPage } from "./_lib/audit-log-page";

interface BusinessApplicationDetailPageProps {
  params: Promise<{ applicationId: string }>;
}

export default async function BusinessApplicationDetailPage({ params }: BusinessApplicationDetailPageProps) {
  const { applicationId } = await params;
  const token = await getAuthToken();

  let applicationRes;
  let auditLogsRes;
  try {
    [applicationRes, auditLogsRes] = await Promise.all([
      getApiAdminBusinessesApplicationsApplicationid(Number(applicationId), withToken(token)),
      getAuditLogPage(Number(applicationId), token),
    ]);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("[404]")) {
      notFound();
    }
    throw error;
  }

  return <BusinessApplicationDetailContent application={applicationRes.data} auditLogPage={auditLogsRes} />;
}
