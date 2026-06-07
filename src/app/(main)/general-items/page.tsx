import { getApiSales } from "@/apis/generated/api";
import { parseDisplayPage, parsePageSize } from "@/lib/page-response";
import Link from "next/link";
import Hero from "../_components/Hero";
import Pagination from "../archive/_components/Pagination";
import GeneralItemSaleCard from "./_components/GeneralItemSaleCard";

function buildPageUrl(page: number, limit: number) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  return `/general-items?${params.toString()}`;
}
interface GeneralItemsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
  }>;
}

export default async function GeneralItemsPage({ searchParams }: GeneralItemsPageProps) {
  const params = await searchParams;
  const page = parseDisplayPage(params.page);
  const size = parsePageSize(params.limit);
  const { data } = await getApiSales({
    page: Math.max(0, page - 1),
    size,
    sort: ["createdAt,desc"],
    saleStatus: "OPEN",
    saleType: "GENERAL",
    productType: "ITEM",
  });
  const sales = data.content ?? [];
  const totalElements = data.page?.totalElements ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));

  return (
    <div className="min-h-screen bg-[#1d2429]">
      <Hero
        backgroundText="ITEMS"
        title="일반상품 판매공고"
        subtitle="배송 주문 가능한 일반상품 판매공고를 확인하세요."
      />

      <main className="mx-auto max-w-[1440px] px-4 pt-3 pb-12 lg:px-10 lg:pt-2">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-400">판매중인 일반상품 {totalElements.toLocaleString("ko-KR")}건</p>
          <Link
            href="/orders/guest"
            className="text-sm font-medium text-white/70 underline-offset-4 hover:text-white hover:underline"
          >
            비회원 주문 조회
          </Link>
        </div>

        {sales.length === 0 ? (
          <div className="border border-dashed border-white/10 bg-white/5 px-4 py-12 text-center text-sm text-gray-400">
            현재 판매 중인 일반상품 공고가 없습니다.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {sales.map((sale) => (
              <GeneralItemSaleCard
                key={sale.id ?? `${sale.productId}-${sale.title}`}
                sale={sale}
                imageUrl={sale.imgUrl}
              />
            ))}
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          buildPageUrl={(nextPage) => buildPageUrl(nextPage, size)}
        />
      </main>
    </div>
  );
}
