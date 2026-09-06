import { getApiUsersBusinessesApplicationsMeOverview, getApiUsersMe, getApiV2Orders } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { authOptions, getAuthToken } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import MyPageClient from "./_components/MyPageClient";
import { type MyPageSearchParams, parseOrderHistoryFilters, toOrderHistoryApiParams } from "./_lib/order-history";
import MyPageLoading from "./loading";

interface MyPageProps {
  searchParams: Promise<MyPageSearchParams>;
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
  const orderFilters = parseOrderHistoryFilters(params);

  const [userResult, ordersResult, businessApplicationOverviewResult] = await Promise.all([
    getApiUsersMe(withToken(token)).catch((e) => {
      if (isRedirectError(e)) throw e;
      console.error("[my-page] getApiUsersMe failed:", e);
      return null;
    }),
    getApiV2Orders(toOrderHistoryApiParams(orderFilters), withToken(token)).catch((e) => {
      if (isRedirectError(e)) throw e;
      console.error("[my-page] getApiV2Orders failed:", e);
      return null;
    }),
    getApiUsersBusinessesApplicationsMeOverview(withToken(token)).catch((e) => {
      if (isRedirectError(e)) throw e;
      console.error("[my-page] getBusinessApplicationOverview failed:", e);
      return null;
    }),
  ]);

  const user = userResult?.data ?? {};
  const orders = ordersResult?.data ?? {
    content: [],
    page: { number: orderFilters.page - 1, totalPages: 0 },
  };
  const businessApplicationOverview = businessApplicationOverviewResult?.data ?? null;

  return (
    <Suspense fallback={<MyPageLoading />}>
      <MyPageClient
        user={user}
        orders={orders}
        ordersError={ordersResult === null}
        orderFilters={orderFilters}
        businessApplicationOverview={businessApplicationOverview}
      />
    </Suspense>
  );
}
