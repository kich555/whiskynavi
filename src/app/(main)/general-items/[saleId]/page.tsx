import {
  getApiItemsId,
  getApiSalesSaleid,
  type ItemResponse,
  type UserSaleAnnouncementResponse,
} from "@/apis/generated/api";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/formatters";
import { getGeneralItemOrderQuantityLimit, isOpenGeneralItemSale } from "../_lib/general-item-sales";
import GeneralItemOrderForm from "./_components/GeneralItemOrderForm";

type GeneralItemSaleDetailPageProps = {
  params: Promise<{ saleId: string }>;
};

function parseSaleId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

async function fetchSale(saleId: number): Promise<UserSaleAnnouncementResponse | null> {
  try {
    const response = await getApiSalesSaleid(saleId);
    return response.data;
  } catch {
    return null;
  }
}

async function fetchItem(productId?: number): Promise<ItemResponse | null> {
  if (productId == null) return null;

  try {
    const response = await getApiItemsId(productId);
    return response.data;
  } catch {
    return null;
  }
}

export default async function GeneralItemSaleDetailPage({ params }: GeneralItemSaleDetailPageProps) {
  const { saleId } = await params;
  const id = parseSaleId(saleId);
  if (!id) notFound();

  const sale = await fetchSale(id);
  if (!sale || !isOpenGeneralItemSale(sale)) notFound();

  const item = await fetchItem(sale.productId);
  const title = sale.title || sale.itemName || item?.name || "일반상품";
  const itemName = sale.itemName || item?.name || title;
  const remainingQuantity = sale.availableQuantity ?? 0;
  const totalQuantity = sale.totalQuantity ?? 0;
  const isSoldOut = remainingQuantity <= 0;
  const quantityLimit = getGeneralItemOrderQuantityLimit(sale);

  return (
    <main className="min-h-screen bg-[#1d2429] pt-20 pb-12 text-white lg:pt-24">
      <div className="mx-auto max-w-[1180px] px-4 lg:px-10">
        <Link
          href="/general-items"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
        >
          <ArrowLeft size={18} />
          목록으로 돌아가기
        </Link>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
          <div className="flex aspect-square items-center justify-center overflow-hidden border border-white/10 bg-black/20">
            {item?.imageUrl ? (
              <ImageWithFallback
                src={item.imageUrl}
                alt={title}
                width={720}
                height={720}
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="h-full w-full object-contain p-6"
                priority
              />
            ) : (
              <div className="px-6 text-center text-sm text-white/45">{title}</div>
            )}
          </div>

          <div className="border border-white/10 bg-white/5 p-5 md:p-8">
            <div className="mb-5 flex items-start justify-between gap-4">
              <h1 className="typo-bold-24 min-w-0 text-white md:text-3xl">{title}</h1>
              <Badge className={`shrink-0 border-transparent text-white ${isSoldOut ? "bg-gray-600" : "bg-green-700"}`}>
                {isSoldOut ? "품절" : "판매중"}
              </Badge>
            </div>

            <p className="text-2xl font-semibold text-white">{formatCurrency(sale.salePrice)}</p>
            <p className="mt-2 text-sm text-gray-400">
              {remainingQuantity.toLocaleString("ko-KR")} / {totalQuantity.toLocaleString("ko-KR")}개 남음
            </p>

            <div className="mt-8 border-t border-white/10 pt-6">
              {isSoldOut ? (
                <span className="block w-full border border-white/10 px-4 py-3 text-center text-sm font-semibold text-gray-500">
                  주문 불가
                </span>
              ) : (
                <GeneralItemOrderForm saleAnnouncementId={sale.id ?? id} quantityLimit={quantityLimit} />
              )}
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
              <h2 className="typo-bold-18 text-white">{itemName}</h2>
              <p className="mt-4 text-sm leading-6 whitespace-pre-line text-gray-300">
                {item?.description || "등록된 상품 설명이 없습니다."}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
