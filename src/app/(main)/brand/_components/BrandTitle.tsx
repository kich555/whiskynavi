"use client";

import { useBrandScroll } from "../_context/BrandScrollContext";

interface Props {
  brandId: string;
  title: string;
  subtitle: string;
}

const BrandTitle = ({ brandId, title, subtitle }: Props) => {
  const { registerRef } = useBrandScroll();

  return (
    <div
      ref={(el) => {
        registerRef(brandId, el);
      }}
      className="mb-8 scroll-mt-[200px] px-6 pt-8 text-center lg:mb-10 lg:px-0"
    >
      <h2 className="mb-3 text-2xl text-white sm:text-3xl lg:text-4xl">{title}</h2>
      <p className="typo-medium-14 text-white/80 sm:text-base lg:text-lg">{subtitle}</p>
    </div>
  );
};

export default BrandTitle;
