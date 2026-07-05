import { getApiAdminOrders, type GetApiAdminOrdersParams } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { parseDisplayPage, parsePageSize, toApiPage } from "@/lib/page-response";
import AdminOrdersContent, { type AdminOrdersSearchParams } from "../orders/_components/AdminOrdersContent";

interface AdminBottleOrdersPageProps {
  searchParams: Promise<AdminOrdersSearchParams>;
}

function emptyToUndefined(value?: string) {
  return value?.trim() || undefined;
}

export default async function AdminBottleOrdersPage({ searchParams }: AdminBottleOrdersPageProps) {
  const params = await searchParams;
  const token = await getAuthToken();
  const page = parseDisplayPage(params.page);
  const size = parsePageSize(params.limit);

  const query: GetApiAdminOrdersParams = {
    page: toApiPage(page),
    size,
    sort: ["createdAt,desc"],
    productType: "BOTTLE",
    orderStatus: emptyToUndefined(params.orderStatus) as GetApiAdminOrdersParams["orderStatus"],
    paymentMethod: emptyToUndefined(params.paymentMethod),
    paymentStatus: emptyToUndefined(params.paymentStatus),
    keyword: emptyToUndefined(params.keyword),
    guestOnly: params.guestOnly === "true" ? true : undefined,
    depositOverdue: params.depositOverdue === "true" ? true : undefined,
  };

  const response = await getApiAdminOrders(query, withToken(token));

  return (
    <AdminOrdersContent
      title="보틀주문관리"
      basePath="/admin/bottle-orders"
      enableGeneralItemActions={false}
      searchParams={{
        ...params,
        page: String(page),
        limit: String(size),
        productType: "BOTTLE",
      }}
      orders={response.data.content ?? []}
      totalElements={response.data.page?.totalElements ?? 0}
    />
  );
}
