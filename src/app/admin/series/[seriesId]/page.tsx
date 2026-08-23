import {
  getApiBottles,
  type AdminBottleSeriesResponse,
  type BottleResponse,
  type BottleSeriesResponse,
  getApiV2AdminBottleSeriesSeriesid,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { NAVI, TAILS, TOGETHER_IN_SPIRIT, TRAIL_AND_TAIL } from "@/app/(main)/brand/_constants";
import { notFound } from "next/navigation";
import SeriesDetailContent from "./_components/SeriesDetailContent";

const BRANDS = [NAVI, TAILS, TRAIL_AND_TAIL, TOGETHER_IN_SPIRIT];

interface SeriesDetailPageProps {
  params: Promise<{ seriesId: string }>;
}

export default async function ProductDetailPage({ params }: SeriesDetailPageProps) {
  const { seriesId } = await params;
  const token = await getAuthToken();

  let product: AdminBottleSeriesResponse | undefined;
  try {
    const res = await getApiV2AdminBottleSeriesSeriesid(Number(seriesId), withToken(token));
    product = res.data;
  } catch {
    notFound();
  }

  const brand = BRANDS.find((b) =>
    b.id.replace(/\s/g, "").includes(product?.brand?.replace(/\s/g, "") ?? ""),
  );

  // 현재 시리즈만 BrandSection에 표시. seriesProducts는 이 시리즈의 제품만 조회한다.
  const series: BottleSeriesResponse[] = product?.series
    ? [
        {
          name: product.series,
          imgUrl: product.imageUrl,
          description: product.description,
          representativeBottleId: product.representativeBottleId,
        },
      ]
    : [];

  const seriesProducts: Record<string, BottleResponse[]> = {};
  if (product?.brand && product.series) {
    const res = await getApiBottles({ brand: [product.brand], series: [product.series], size: 12 });
    seriesProducts[product.series] = res.data.content ?? [];
  }

  return (
    <SeriesDetailContent
      series={product}
      brand={brand}
      seriesList={series}
      seriesProducts={seriesProducts}
    />
  );
}
