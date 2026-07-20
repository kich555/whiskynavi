import type { BottleResponse } from "@/apis/generated/api";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import type { Carousel3DPosition } from "@/components/ui/carousel-3d";
import Link from "next/link";
import { memo } from "react";

interface Props {
  bottle: BottleResponse;
  bottleIndex: number;
  position: Carousel3DPosition;
  isCenter: boolean;
  brandName: string;
  onSelect: (index: number) => void;
}

const CarouselBottleCard = memo(function CarouselBottleCard({
  bottle,
  bottleIndex,
  position,
  isCenter,
  brandName,
  onSelect,
}: Props) {
  const baseWidth = 240;
  const cardWidth = baseWidth * position.scale;
  const cardHeight = cardWidth * 1.25;

  return (
    <div
      className={`absolute transition-all duration-700 ease-in-out ${!isCenter ? "cursor-pointer" : ""}`}
      style={{
        transform: `
          translateX(${position.x}px)
          translateY(${position.y}px)
          translateZ(${position.z}px)
          rotateY(${position.rotateY}deg)
        `,
        opacity: position.opacity,
        transformStyle: "preserve-3d",
        zIndex: position.zIndex,
        width: `${cardWidth}px`,
        height: `${cardHeight}px`,
        filter: `brightness(${position.brightness})`,
      }}
      onClick={() => {
        if (!isCenter) {
          onSelect(bottleIndex);
        }
      }}
    >
      <div
        className={`flex h-full flex-col border backdrop-blur-2xl ${isCenter ? "border-white/30 bg-[#2f3740]/75 shadow-[0_8px_32px_rgba(0,0,0,0.4)]" : "border-white/20 bg-[#2a3137]/30 shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-colors hover:border-white/40"} ${isCenter ? "p-5" : position.scale === 0.85 ? "p-4" : "p-3"}`}
      >
        <div className="mb-3 flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden">
          {isCenter && bottle.imgUrl ? (
            <ImageLightbox src={bottle.imgUrl} alt={bottle.name ?? ""}>
              <ImageWithFallback
                src={bottle.imgUrl}
                alt={bottle.name ?? ""}
                width={Math.round(cardWidth - 40)}
                height={Math.round((cardWidth - 40) * 1.2)}
                className="h-full w-full object-contain"
              />
            </ImageLightbox>
          ) : (
            <ImageWithFallback
              src={bottle.imgUrl ?? "/default-bottle-v2.png"}
              alt={bottle.name ?? ""}
              width={Math.round(cardWidth - (isCenter ? 40 : position.scale === 0.85 ? 32 : 24))}
              height={Math.round((cardWidth - (isCenter ? 40 : position.scale === 0.85 ? 32 : 24)) * 1.2)}
              className="h-full w-full object-contain"
            />
          )}
        </div>
        <div className="shrink-0">
          {isCenter ? (
            <Link
              href={`/archive/${bottle.id}`}
              className="block transition-colors hover:opacity-80"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="typo-bold-12 mb-4 inline-block border border-white/20 bg-white/15 px-2.5 py-1 text-white/90 backdrop-blur-sm">
                {brandName}
              </span>
              <h4 className="typo-medium-14 line-clamp-2 leading-snug break-all text-white">{bottle.name}</h4>
            </Link>
          ) : (
            <>
              <span className="typo-bold-12 mb-4 inline-block border border-white/20 bg-white/15 px-2.5 py-1 text-white/90 backdrop-blur-sm">
                {brandName}
              </span>
              <h4 className="typo-medium-14 mb-2 line-clamp-2 leading-snug break-all text-white">{bottle.name}</h4>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default CarouselBottleCard;
