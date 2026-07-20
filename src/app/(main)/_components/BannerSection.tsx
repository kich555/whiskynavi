"use client";

import { useEffect, useState } from "react";

import type { UserBannerResponse } from "@/apis/generated/api";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { ChevronDown } from "lucide-react";

interface BannerSectionProps {
  banners: UserBannerResponse[];
}

export default function BannerSection({ banners }: BannerSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slideCount = banners.length;

  useEffect(() => {
    if (slideCount === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }, 5000);

    return () => clearInterval(timer);
  }, [slideCount]);

  if (slideCount === 0) {
    return (
      <section className="relative flex h-screen items-center justify-center">
        <div className="text-center text-white/60">
          <p className="text-lg">배너가 준비 중입니다</p>
        </div>
      </section>
    );
  }

  const currentBanner = banners[currentSlide];

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        <div className="absolute inset-0 animate-[fadeIn_1s_ease-out]">
          <ImageWithFallback
            src={currentBanner.backgroundUrl ?? "/bg-sample.png"}
            alt={currentBanner.title ?? ""}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>

        <div className="relative flex h-full animate-[slideUp_1s_ease-out_0.3s_both] items-center justify-center px-4 md:px-6">
          <div className="mx-auto w-full max-w-[1440px]">
            <div className="mx-auto text-center">
              <h1 className="mb-2 text-xl leading-tight text-white md:mb-4 md:text-4xl lg:mb-6 lg:text-5xl xl:text-6xl">
                {currentBanner.title}
              </h1>
              <p className="typo-medium-14 mb-4 leading-relaxed text-white/90 md:mb-8 md:text-base lg:mb-10 lg:text-lg xl:text-xl">
                {currentBanner.description}
              </p>
              {currentBanner.link ? (
                <a
                  href={currentBanner.link}
                  className="typo-medium-14 inline-block bg-white/90 px-5 py-2 text-black transition-all hover:bg-white md:px-8 md:py-3 md:text-base lg:px-10 lg:py-4 lg:text-lg"
                >
                  자세히 보기
                </a>
              ) : (
                <span className="typo-medium-14 inline-block bg-white/90 px-5 py-2 text-black md:px-8 md:py-3 md:text-base lg:px-10 lg:py-4 lg:text-lg">
                  자세히 보기
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute right-0 bottom-0 left-0 pb-4 md:pb-10 lg:pb-12">
          <div className="flex justify-center">
            <ChevronDown
              className="animate-scroll-down h-6 w-6 text-white/40 md:h-10 md:w-10 lg:h-12 lg:w-12"
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* Vertical Slide dots */}
        <div className="absolute top-1/2 right-3 z-10 flex -translate-y-1/2 flex-col gap-2 md:right-6 md:gap-3 lg:right-10">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-0.5 transition-all md:w-1 ${
                index === currentSlide ? "h-4 bg-white md:h-6 lg:h-8" : "h-0.5 bg-white/30 hover:bg-white/50 md:h-1"
              }`}
            />
          ))}
        </div>
      </section>
    </>
  );
}
