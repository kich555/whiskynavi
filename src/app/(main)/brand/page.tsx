import {
  getApiBottles,
  getApiBottlesBrandSeries,
  type BottleBrandSeriesResponse,
  type BottleResponse,
  type BottleSeriesResponse,
} from "@/apis/generated/api";
import type { Brand } from "@/types/brand";
import { Effect } from "effect";
import Hero from "../_components/Hero";
import BrandNavigation from "./_components/BrandNavigation";
import BrandSection from "./_components/BrandSection";
import { NAVI, TAILS, TOGETHER_IN_SPIRIT, TRAIL_AND_TAIL } from "./_constants";
import { BrandScrollProvider } from "./_context/BrandScrollContext";

const BRANDS: Brand[] = [NAVI, TAILS, TRAIL_AND_TAIL, TOGETHER_IN_SPIRIT];

// 브랜드 시리즈 목록 캐시 (브랜드별 series 배열)
const CACHE_TTL = 3600_000; // 1시간
const cache = new Map<string, { expiresAt: number; value: unknown }>();

const cacheGet = <T,>(key: string): T | undefined => {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.value as T;
};

const cacheSet = (key: string, value: unknown) => {
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL, value });
};

const fetchBrandSeries = async (): Promise<BottleBrandSeriesResponse[] | null> => {
  const cacheKey = "brandSeries";
  const cached = cacheGet<BottleBrandSeriesResponse[] | null>(cacheKey);
  if (cached) return cached;

  const result = await Effect.runPromise(
    Effect.tryPromise(() => getApiBottlesBrandSeries()).pipe(
      Effect.map(({ data }) => data),
      Effect.catchIf(
        () => true,
        () => Effect.succeed(null),
      ),
    ),
  );

  cacheSet(cacheKey, result);
  return result;
};

const fetchSeriesProducts = (brand: Brand, apiBrandName: string, series: BottleSeriesResponse[]) =>
  Effect.all(
    series
      .map((s) => s.name)
      .filter((name): name is string => Boolean(name))
      .map((seriesName) =>
        Effect.tryPromise(() =>
          getApiBottles(
            { brand: [apiBrandName], series: [seriesName], size: 12 },
            { cache: "force-cache", next: { revalidate: 3600 } },
          ),
        ).pipe(
          Effect.map(({ data }) => [seriesName, data.content ?? []] as const),
          Effect.catchIf(
            () => true,
            () => Effect.succeed([seriesName, []] as const),
          ),
        ),
      ),
    { concurrency: "unbounded" },
  ).pipe(Effect.map((entries) => Object.fromEntries(entries)));

const Page = async () => {
  // 브랜드별 시리즈 목록 조회 (1시간 캐시)
  const brandSeries = await fetchBrandSeries();
  // 브랜드 id → 시리즈 목록 매핑. BRANDS에 없는 브랜드(위스키에이지 등)는 제외.
  // dev/prod 간 브랜드명 불일치("위스키테일즈" vs "더위스키테일즈") 대응 위해
  // id가 API 브랜드명을 부분 포함하는지(정규화 후)로 매칭한다.
  const seriesByBrand = new Map<string, { apiBrandName: string; series: BottleSeriesResponse[] }>();
  for (const { brand, series } of brandSeries ?? []) {
    if (!brand || !series) continue;
    const match = BRANDS.find((b) => b.id.replace(/\s/g, "").includes(brand.replace(/\s/g, "")));
    if (match) seriesByBrand.set(match.id, { apiBrandName: brand, series });
  }

  // 브랜드별 시리즈당 제품 목록 병렬 fetch → 브랜드 id → (시리즈명 → 제품 목록) 맵
  const brandSeriesProducts: Record<string, Record<string, BottleResponse[]>> = await Effect.runPromise(
    Effect.all(
      BRANDS.map((brand) => {
        const entry = seriesByBrand.get(brand.id);
        return fetchSeriesProducts(brand, entry?.apiBrandName ?? brand.id, entry?.series ?? []).pipe(
          Effect.map((products) => [brand.id, products] as const),
        );
      }),
      { concurrency: "unbounded" },
    ),
  ).then((entries) => Object.fromEntries(entries));

  return (
    <main className="min-h-screen bg-[#1d2429]">
      <BrandScrollProvider>
        <div className="h-screen">
          <Hero backgroundText="BRANDS" title="브랜드" subtitle="각 브랜드별 시리즈를 만나보세요" />
          <BrandNavigation brands={BRANDS} />
        </div>
        {BRANDS.map((brand) => (
          <BrandSection
            key={brand.id}
            brand={brand}
            series={seriesByBrand.get(brand.id)?.series ?? []}
            seriesProducts={brandSeriesProducts[brand.id] ?? {}}
          />
        ))}
      </BrandScrollProvider>
      <div className="h-[114px]" />
    </main>
  );
};

export default Page;
