import type { BottleResponse } from "@/apis/generated/api";
import type { Brand } from "@/types/brand";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import ProductCarousel from "./ProductCarousel";

interface SeriesExplorerProps {
  brand: Brand;
  seriesProducts: Record<string, BottleResponse[]>;
  selected: string;
}

const SeriesExplorer = ({ brand, seriesProducts, selected }: SeriesExplorerProps) => {
  const products = seriesProducts[selected] ?? [];

  return (
    <div className="mx-auto max-w-[1200px] px-6">
      {/* Series panel: header row (title + select) + carousel */}
      <div className="">
        {/* Header row */}
        {/* <div className="flex items-center justify-between gap-4 px-5 py-4 lg:px-8 lg:py-6"></div> */}

        {/* Selected series carousel */}
        {products.length > 0 && <ProductCarousel key={selected} brandProducts={products} brand={brand} />}

        {/* Archive Link for selected series */}
        {selected && (
          <div className="px-5 py-5 text-center lg:py-6">
            <Link
              href={`/archive?brand=${encodeURIComponent(brand.id)}&series=${encodeURIComponent(selected)}`}
              className="typo-medium-14 inline-flex min-h-11 items-center justify-center gap-2 border border-white px-6 text-white transition-all hover:bg-white hover:text-[#1d2429] sm:px-7 sm:text-base"
            >
              {selected} 제품 보러가기
              <ArrowRight size={16} className="shrink-0" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeriesExplorer;
