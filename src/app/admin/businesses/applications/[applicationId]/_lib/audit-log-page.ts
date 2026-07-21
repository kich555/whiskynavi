import type { AdminBusinessApplicationAuditLogResponse } from "@/apis/generated/api";
import customFetch, { withToken } from "@/apis/mutator";

export interface AuditLogPageData {
  content: AdminBusinessApplicationAuditLogResponse[];
  page?: {
    size?: number;
    number?: number;
    totalElements?: number;
    totalPages?: number;
  };
}

type AuditLogPageEnvelope = {
  data: AuditLogPageData | AdminBusinessApplicationAuditLogResponse[];
};

const AUDIT_LOG_PAGE_SIZE = 100;

/** PR #208의 Spring Page 계약을 생성 클라이언트 버전과 무관하게 호출하고 정규화합니다. */
export async function getAuditLogPage(applicationId: number, token?: string): Promise<AuditLogPageData> {
  const params = new URLSearchParams({
    page: "0",
    size: String(AUDIT_LOG_PAGE_SIZE),
    sort: "id,desc",
  });
  const url = `/api/admin/businesses/applications/${applicationId}/audit-logs?${params.toString()}`;
  const response = await customFetch<AuditLogPageEnvelope>(url, {
    ...(withToken(token) ?? {}),
    method: "GET",
  });

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
