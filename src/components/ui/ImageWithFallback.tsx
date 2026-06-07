"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const ERROR_IMG_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

// S3 버킷은 Vercel Image Optimization Transformations 쿼터 절약을 위해 제외 → 자동 unoptimized 처리
const ALLOWED_HOSTNAMES = ["images.unsplash.com"];

function shouldSkipOptimization(src: ImageProps["src"]): boolean {
  if (typeof src !== "string") return false;
  // relative paths are fine
  if (src.startsWith("/")) return false;
  try {
    const { hostname } = new URL(src);
    return !ALLOWED_HOSTNAMES.includes(hostname);
  } catch {
    // malformed URL — skip optimization to avoid server error
    return true;
  }
}

type ImageWithFallbackProps = Omit<ImageProps, "src"> & { src?: ImageProps["src"] };

export function ImageWithFallback({ className, style, ...rest }: ImageWithFallbackProps) {
  const [didError, setDidError] = useState(false);
  const { src, ...restWithoutSrc } = rest;

  if (didError || !src || src === "") {
    return (
      <div className={`inline-block bg-gray-100 text-center align-middle ${className ?? ""}`} style={style}>
        <div className="flex h-full w-full items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ERROR_IMG_SRC} alt="Error loading image" data-original-url={String(src)} />
        </div>
      </div>
    );
  }

  return (
    <Image
      {...restWithoutSrc}
      src={src}
      className={className}
      style={style}
      unoptimized={restWithoutSrc.unoptimized ?? shouldSkipOptimization(src)}
      onError={() => setDidError(true)}
      alt={restWithoutSrc.alt}
    />
  );
}
