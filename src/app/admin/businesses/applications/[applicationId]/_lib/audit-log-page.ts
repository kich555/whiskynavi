import type { AdminBusinessApplicationAuditLogResponse } from "@/apis/generated/api";
import {
  getApiAdminBusinessesApplicationsApplicationidAuditLogs,
  getGetApiAdminBusinessesApplicationsApplicationidAuditLogsUrl,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";

export interface AuditLogPageData {
  content: AdminBusinessApplicationAuditLogResponse[];
  page?: {
    size?: number;
    number?: number;
    totalElements?: number;
    totalPages?: number;
  };
}

interface AuditLogPageParams {
  page?: number;
  size?: number;
  sort?: string[];
}

type AuditLogPageEnvelope = {
  data: AuditLogPageData | AdminBusinessApplicationAuditLogResponse[];
};

type AuditLogPageFetcher = (
  applicationId: number,
  params: AuditLogPageParams,
  options?: RequestInit,
) => Promise<AuditLogPageEnvelope>;

type LegacyAuditLogFetcher = (applicationId: number, options?: RequestInit) => Promise<AuditLogPageEnvelope>;

type AuditLogPageUrlBuilder = (applicationId: number, params?: AuditLogPageParams) => string;

/** PR #208의 Spring Page 응답을 화면용 계약으로 정규화합니다. */
export async function getAuditLogPage(applicationId: number, token?: string): Promise<AuditLogPageData> {
  const params: AuditLogPageParams = {
    page: 0,
    size: 100,
    sort: ["id,desc"],
  };
  const urlBuilder = getGetApiAdminBusinessesApplicationsApplicationidAuditLogsUrl as unknown as AuditLogPageUrlBuilder;
  const generatedUrl = urlBuilder(applicationId, params);
  const supportsPageParams = generatedUrl.includes("size=");
  const options = withToken(token);

  const response = supportsPageParams
    ? await (getApiAdminBusinessesApplicationsApplicationidAuditLogs as unknown as AuditLogPageFetcher)(
        applicationId,
        params,
        options,
      )
    : await (getApiAdminBusinessesApplicationsApplicationidAuditLogs as unknown as LegacyAuditLogFetcher)(
        applicationId,
        options,
      );

  if (Array.isArray(response.data)) {
    return {
      content: response.data,
      page: {
        number: 0,
        size: response.data.length,
        totalElements: response.data.length,
        totalPages: response.data.length > 0 ? 1 : 0,
      },
    };
  }

  return {
    content: response.data.content ?? [],
    page: response.data.page,
  };
}
