import { getApiBottles, type BottleResponse } from "@/apis/generated/api";
import type { Brand } from "@/types/brand";
import Link from "next/link";
import Hero from "../_components/Hero";
import BrandBackground from "./_components/BrandBackground";
import BrandNavigation from "./_components/BrandNavigation";
import BrandTitle from "./_components/BrandTitle";
import ProductCarousel from "./_components/ProductCarousel";
import { NAVI, TAILS, TOGETHER_IN_SPIRIT, TRAIL_AND_TAIL } from "./_constants";
import { BrandScrollProvider } from "./_context/BrandScrollContext";

const BRANDS: Brand[] = [NAVI, TAILS, TRAIL_AND_TAIL, TOGETHER_IN_SPIRIT];

const Page = async () => {
  const brandBottlesEntries = await Promise.all(
    BRANDS.map(async (brand) => {
      try {
        const { data } = await getApiBottles({
          brand: [brand.id],
          page: 0,
          size: 6,
        });
        return [brand.id, data.content ?? []] as const;
      } catch {
        return [brand.id, []] as const;
      }
    }),
  );

  const bottlesMap: Record<string, BottleResponse[]> = Object.fromEntries(brandBottlesEntries);

  return (
    <main className="min-h-screen bg-[#1d2429]">
      <Hero backgroundText="BRANDS" title="브랜드" subtitle="위스키내비의 브랜드 라인을 만나보세요." />
      {/* <BrandContent brands={BRANDS} bottlesMap={bottlesMap} /> */}
      <BrandScrollProvider>
        <BrandNavigation brands={BRANDS} />
        {BRANDS.map((brand) => {
          const brandProducts = bottlesMap[brand.id] ?? [];
          return (
            <section className="relative mb-12 py-16 lg:mb-20 lg:py-20" key={brand.id}>
              <BrandBackground bgImage={brand.bgImage} name={brand.name} />
              <div className="relative">
                <BrandTitle brandId={brand.id} title={brand.name} subtitle={brand.subname} />
                {/* Brand Philosophy */}
                <div className="mx-auto max-w-3xl px-6 text-center lg:mb-8">
                  <p className="typo-medium-14 leading-relaxed text-white/90 sm:text-base">{brand.description}</p>
                </div>

                {/* Products Carousel */}
                {brandProducts.length > 0 && <ProductCarousel brandProducts={brandProducts} brand={brand} />}

                {/* Archive Button */}
                <div className="mt-6 text-center lg:mt-8">
                  <Link
                    href={`/archive?brand=${brand.id}`}
                    className="typo-medium-14 inline-block border border-white px-6 py-2 text-white transition-all hover:bg-white hover:text-[#1d2429] sm:px-7 sm:py-2.5 sm:text-base"
                  >
                    더 많은 제품 보러가기
                  </Link>
                </div>
              </div>
            </section>
          );
        })}
      </BrandScrollProvider>
      <div className="h-[114px]" />
    </main>
  );
};

export default Page;
