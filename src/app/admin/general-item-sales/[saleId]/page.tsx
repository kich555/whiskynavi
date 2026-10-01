import { ApiError } from "@/apis/errors";
import { getApiAdminSalesSaleid } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import GeneralItemSaleDetailContent from "./_components/GeneralItemSaleDetailContent";

export default async function GeneralItemSaleDetailPage({ params }: { params: Promise<{ saleId: string }> }) {
  const { saleId: rawId } = await params;
  const saleId = Number(rawId);
  if (!/^\d+$/.test(rawId) || !Number.isSafeInteger(saleId) || saleId <= 0) notFound();
  const session = await getServerSession(authOptions);
  if (!session?.accessToken || session.error) redirect("/sign-in");
  if (!session.user.roles?.includes("ROLE_ADMIN")) redirect("/");
  const sale = await getApiAdminSalesSaleid(saleId, { ...withToken(session.accessToken), cache: "no-store" }).catch(
    (error) => {
    // 현재 판매공고 API는 존재하지 않는 ID에도 400을 반환한다.
    if (error instanceof ApiError && (error.status === 400 || error.status === 404)) notFound();
      throw error;
    },
  );
  if (sale.data.productType !== "ITEM" || sale.data.saleType !== "GENERAL") notFound();
  return <GeneralItemSaleDetailContent saleId={saleId} sale={sale.data} />;
}
