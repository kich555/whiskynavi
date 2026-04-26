import { getApiOrders, getApiUsersBusinessesApplicationsMeHistory, getApiUsersMe } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { authOptions, getAuthToken } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import MyPageClient from "./_components/MyPageClient";
import MyPageLoading from "./loading";

interface MyPageProps {
  searchParams: Promise<{ page?: string; tab?: string }>;
}

export default async function MyPage({ searchParams }: MyPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/sign-in?callbackUrl=/my-page");
  }

  const token = await getAuthToken();

  if (!token) {
    redirect("/sign-in?callbackUrl=/my-page");
  }

  const params = await searchParams;
  const page = Number(params.page) || 0;

  const [userResult, ordersResult, businessApplicationHistoryResult] = await Promise.all([
    getApiUsersMe(withToken(token)).catch((e) => {
      if (isRedirectError(e)) throw e;
      console.error("[my-page] getApiUsersMe failed:", e);
      return null;
    }),
    getApiOrders({ page, size: 10, sort: ["createdAt,desc"] }, withToken(token)).catch((e) => {
      if (isRedirectError(e)) throw e;
      console.error("[my-page] getApiOrders failed:", e);
      return null;
    }),
    getApiUsersBusinessesApplicationsMeHistory({ page, size: 10, sort: ["createdAt,desc"] }, withToken(token)).catch(
      (e) => {
        if (isRedirectError(e)) throw e;
        console.error("[my-page] getBusinessApplicationHistory failed:", e);
        return null;
      },
    ),
  ]);

  const user = userResult?.data ?? {};
  const orders = ordersResult?.data ?? { content: [], totalPages: 0 };
  const businessApplicationHistory = businessApplicationHistoryResult?.data?.content ?? null;

  return (
    <Suspense fallback={<MyPageLoading />}>
      <MyPageClient user={user} orders={orders} businessApplicationHistory={businessApplicationHistory} />
    </Suspense>
  );
}
