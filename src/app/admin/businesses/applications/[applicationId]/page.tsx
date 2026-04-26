import {
  getApiAdminBusinessesApplicationsApplicationid,
  getApiAdminBusinessesApplicationsApplicationidAuditLogs,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { notFound } from "next/navigation";
import BusinessApplicationDetailContent from "./_components/BusinessApplicationDetailContent";

interface BusinessApplicationDetailPageProps {
  params: Promise<{ applicationId: string }>;
}

export default async function BusinessApplicationDetailPage({
  params,
}: BusinessApplicationDetailPageProps) {
  const { applicationId } = await params;
  const token = await getAuthToken();

  try {
    const [applicationRes, auditLogsRes] = await Promise.all([
      getApiAdminBusinessesApplicationsApplicationid(
        Number(applicationId),
        withToken(token),
      ),
      getApiAdminBusinessesApplicationsApplicationidAuditLogs(
        Number(applicationId),
        withToken(token),
      ),
    ]);

    return (
      <BusinessApplicationDetailContent
        application={applicationRes.data}
        auditLogs={auditLogsRes.data}
      />
    );
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("[404]")) {
      notFound();
    }
    throw error;
  }
}
