import { getApiAdminOrdersUsersUserid, getApiAdminUsersId } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { parseApiPage, parseDisplayPage, parsePageSize } from "@/lib/page-response";
import { notFound } from "next/navigation";
import UserDetailContent from "./_components/UserDetailContent";

export interface UserDetailSearchParams extends Record<string, string | undefined> {
  limit?: string;
  page?: string;
  tab?: string;
}

interface UserDetailPageProps {
  params: Promise<{ userId: string }>;
  searchParams: Promise<UserDetailSearchParams>;
}

export default async function UserDetailPage({ params, searchParams }: UserDetailPageProps) {
  const { userId } = await params;
  const sp = await searchParams;
  const token = await getAuthToken();
  const currentOrderPage = parseDisplayPage(sp.page);
  const orderItemsPerPage = parsePageSize(sp.limit);
  let user;
  let orderSummary;

  try {
    const [userRes, orderRes] = await Promise.all([
      getApiAdminUsersId(Number(userId), withToken(token)),
      getApiAdminOrdersUsersUserid(
        Number(userId),
        {
          page: parseApiPage(sp.page),
          size: orderItemsPerPage,
        },
        withToken(token),
      ),
    ]);
    user = userRes.data;
    orderSummary = orderRes.data;
  } catch {
    notFound();
  }

  return (
    <UserDetailContent
      user={user}
      orderSummary={orderSummary}
      searchParams={sp}
      initialActiveTab={sp.tab === "reservations" ? "reservations" : "info"}
      currentOrderPage={currentOrderPage}
      orderItemsPerPage={orderItemsPerPage}
    />
  );
}
