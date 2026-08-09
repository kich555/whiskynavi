"use client";

import { Brand } from "@/types/brand";
import Image from "next/image";
import { useBrandScroll } from "../_context/BrandScrollContext";

interface Props {
  brands: Brand[];
}

const BrandNavigation = ({ brands }: Props) => {
  const { scrollTo: scrollToBrand } = useBrandScroll();
  return (
    <div className="bg-[#1d2429] py-6 pb-16 transition-all duration-500 lg:py-4 lg:pb-8">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        {/* Desktop: 4 Tabs in Equal Grid */}
        <div className={`mx-auto hidden max-w-5xl gap-6 transition-all duration-500 lg:grid lg:grid-cols-4`}>
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => scrollToBrand(brand.id)}
              className={`group relative flex aspect-square items-center justify-center overflow-hidden border border-white/10 bg-white/5 transition-all hover:border-white/30 hover:bg-white/10`}
            >
              <Image
                src={brand.icon}
                alt={brand.name}
                className="max-h-[65%] max-w-[65%] object-contain transition-all group-hover:scale-105"
                width={brand.iconSize.width}
                height={brand.iconSize.height}
              />
            </button>
          ))}
        </div>

        {/* Mobile & Tablet: 2x2 Grid */}
        <div className={`mx-auto grid max-w-md grid-cols-2 gap-4 transition-all duration-500 lg:hidden`}>
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => scrollToBrand(brand.id)}
              className={`group relative flex aspect-square items-center justify-center overflow-hidden border border-white/10 bg-white/5 transition-all hover:border-white/30 hover:bg-white/10`}
            >
              <Image
                src={brand.icon}
                alt={brand.name}
                className="max-h-[60%] max-w-[60%] object-contain transition-all group-hover:scale-105"
                width={brand.iconSize.width}
                height={brand.iconSize.height}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrandNavigation;
