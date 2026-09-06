"use client";

import { BottleResponse } from "@/apis/generated/api";
import { Carousel3D } from "@/components/ui/carousel-3d";
import { Brand } from "@/types/brand";
import CarouselBottleCard from "./CarouselBottleCard";

interface Props {
  brandProducts: BottleResponse[];
  brand: Brand;
}

const ProductCarousel = ({ brandProducts, brand }: Props) => {
  return (
    <div className="overflow-x-clip px-6">
      <div className="mx-auto max-w-[1200px]">
        <Carousel3D
          items={brandProducts}
          itemKey={(_, index) => `${brand.id}-bottle-${index}`}
          renderItem={({ item, index, position, isCenter, onSelect }) => (
            <CarouselBottleCard
              bottle={item}
              bottleIndex={index}
              position={position}
              isCenter={isCenter}
              onSelect={onSelect}
            />
          )}
        />
      </div>
    </div>
  );
};

export default ProductCarousel;
