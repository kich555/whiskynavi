"use client";

import { ReactNode } from "react";
import { useBrandScroll } from "../_context/BrandScrollContext";

interface Props {
  brandId: string;
  children: ReactNode;
}

const BrandSectionShell = ({ brandId, children }: Props) => {
  const { registerRef } = useBrandScroll();

  return (
    <section
      ref={(el) => {
        registerRef(brandId, el);
      }}
      className="relative mb-12 scroll-mt-16 py-16 lg:mb-20 lg:scroll-mt-20 lg:py-20"
    >
      {children}
    </section>
  );
};

export default BrandSectionShell;