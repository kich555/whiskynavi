import { list1 as listAdminInquiries, type AdminInquirySummaryResponse, type List1Status } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { parseDisplayPage, parsePageSize, toApiPage } from "@/lib/page-response";
import AdminInquiriesContent from "./_components/AdminInquiriesContent";

export interface AdminInquiriesSearchParams extends Record<string, string | undefined> {
  page?: string;
  limit?: string;
  status?: string;
}

interface AdminInquiriesPageProps {
  searchParams: Promise<AdminInquiriesSearchParams>;
}

const STATUS_VALUES = new Set<List1Status>(["WAITING", "ANSWERED", "CLOSED"]);

export default async function AdminInquiriesPage({ searchParams }: AdminInquiriesPageProps) {
  const params = await searchParams;
  const token = await getAuthToken();
  const currentPage = parseDisplayPage(params.page);
  const pageSize = parsePageSize(params.limit, 20);
  const status = STATUS_VALUES.has(params.status as List1Status) ? (params.status as List1Status) : undefined;

  const response = await listAdminInquiries(
    {
      page: toApiPage(currentPage),
      size: pageSize,
      sort: ["lastMessageAt,desc"],
      ...(status ? { status } : {}),
    },
    withToken(token),
  );

  return (
    <AdminInquiriesContent
      searchParams={params}
      inquiries={(response.data.content ?? []) as AdminInquirySummaryResponse[]}
      totalElements={response.data.page?.totalElements ?? 0}
    />
  );
}
