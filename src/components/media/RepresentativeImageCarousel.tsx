"use client";

import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState, type ReactNode } from "react";

interface RepresentativeImageCarouselProps {
  images: Array<string | null | undefined>;
  alt: string;
  className?: string;
  imageClassName?: string;
  surfaceClassName?: string;
  emptyContent?: ReactNode;
  children?: ReactNode;
  zoom?: "lightbox" | "none";
}

export default function RepresentativeImageCarousel({
  images,
  alt,
  className,
  imageClassName,
  surfaceClassName,
  emptyContent,
  children,
  zoom = "lightbox",
}: RepresentativeImageCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const imageUrls = useMemo(
    () => Array.from(new Set(images.filter((image): image is string => Boolean(image?.trim())))),
    [images],
  );

  useEffect(() => {
    if (!api) return;

    const updateSelectedIndex = () => setSelectedIndex(api.selectedScrollSnap());
    updateSelectedIndex();
    api.on("select", updateSelectedIndex);
    api.on("reInit", updateSelectedIndex);

    return () => {
      api.off("select", updateSelectedIndex);
      api.off("reInit", updateSelectedIndex);
    };
  }, [api]);

  const hasMultipleImages = imageUrls.length > 1;

  if (imageUrls.length === 0) {
    return (
      <div
        className={cn(
          "relative flex aspect-square items-center justify-center overflow-hidden",
          surfaceClassName,
          className,
        )}
      >
        {emptyContent}
        {children}
      </div>
    );
  }

  return (
    <div className={cn("relative aspect-square overflow-hidden", className)}>
      <Carousel opts={{ loop: hasMultipleImages }} setApi={setApi} className="h-full" aria-label={`${alt} 이미지`}>
        <CarouselContent className="ml-0">
          {imageUrls.map((imageUrl, index) => {
            const image = (
              <ImageWithFallback
                src={imageUrl}
                alt={imageUrls.length > 1 ? `${alt} 이미지 ${index + 1}` : alt}
                fill
                className={cn("object-contain p-4", imageClassName)}
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority={index === 0}
              />
            );

            return (
              <CarouselItem key={`${imageUrl}-${index}`} className="pl-0">
                <div className={cn("relative aspect-square", surfaceClassName)}>
                  {zoom === "lightbox" ? (
                    <ImageLightbox src={imageUrl} alt={alt}>
                      {image}
                    </ImageLightbox>
                  ) : (
                    image
                  )}
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>

        {hasMultipleImages && (
          <>
            <CarouselPrevious
              type="button"
              aria-label="이전 이미지"
              className="left-3 z-10 border-white/20 bg-black/50 text-white hover:bg-black/70 hover:text-white"
            />
            <CarouselNext
              type="button"
              aria-label="다음 이미지"
              className="right-3 z-10 border-white/20 bg-black/50 text-white hover:bg-black/70 hover:text-white"
            />
          </>
        )}
      </Carousel>

      {hasMultipleImages && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/55 px-3 py-2 backdrop-blur-sm">
          {imageUrls.map((imageUrl, index) => (
            <button
              key={`${imageUrl}-indicator`}
              type="button"
              onClick={() => api?.scrollTo(index)}
              aria-label={`${index + 1}번째 이미지 보기`}
              aria-current={selectedIndex === index ? "true" : undefined}
              className={cn(
                "size-2 cursor-pointer rounded-full transition-colors",
                selectedIndex === index ? "bg-white" : "bg-white/40 hover:bg-white/70",
              )}
            />
          ))}
          <span className="typo-medium-12 ml-1 text-white">
            {selectedIndex + 1} / {imageUrls.length}
          </span>
        </div>
      )}

      {children}
    </div>
  );
}
