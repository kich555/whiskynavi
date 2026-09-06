"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

const ANIMATION_DURATION = 400;
const SWIPE_THRESHOLD = 50;
const DRAG_THRESHOLD = 10;

export interface Carousel3DPosition {
  x: number;
  y: number;
  z: number;
  rotateY: number;
  scale: number;
  opacity: number;
  zIndex: number;
  brightness: number;
}

export interface Carousel3DItemProps<T> {
  item: T;
  index: number;
  currentIndex: number;
  totalItems: number;
  position: Carousel3DPosition;
  isCenter: boolean;
  onSelect: (index: number) => void;
}

interface Carousel3DProps<T> {
  items: T[];
  renderItem: (props: Carousel3DItemProps<T>) => React.ReactNode;
  getPosition?: (currentIndex: number, itemIndex: number, totalItems: number) => Carousel3DPosition | null;
  visibleRange?: number;
  cardSpacing?: number;
  containerClassName?: string;
  containerHeight?: string;
  showNavButtons?: boolean;
  showIndicators?: boolean;
  itemKey?: (item: T, index: number) => string;
}

function getDefaultPosition(
  currentCenter: number,
  itemIndex: number,
  totalItems: number,
  visibleRange: number,
  cardSpacing: number,
): Carousel3DPosition | null {
  let relativePos = itemIndex - currentCenter;
  if (relativePos > totalItems / 2) relativePos -= totalItems;
  if (relativePos < -totalItems / 2) relativePos += totalItems;

  if (Math.abs(relativePos) > visibleRange) return null;

  const x = relativePos * cardSpacing;
  const y = 0;
  const z = -Math.abs(relativePos) * 150;
  const rotateY = 0;

  const distanceFromCenter = Math.abs(relativePos);
  let scale: number;
  if (distanceFromCenter === 0) scale = 1;
  else if (distanceFromCenter === 1) scale = 0.85;
  else scale = 0.7;

  let brightness: number;
  if (distanceFromCenter === 0) brightness = 1;
  else if (distanceFromCenter === 1) brightness = 0.6;
  else brightness = 0.4;

  const opacity = 1;
  const zIndex = 30 - distanceFromCenter * 10;

  return { x, y, z, rotateY, scale, opacity, zIndex, brightness };
}

export function Carousel3D<T>({
  items,
  renderItem,
  getPosition,
  visibleRange = 2,
  cardSpacing = 180,
  containerClassName = "",
  containerHeight = "440px",
  showNavButtons = true,
  showIndicators = true,
  itemKey,
}: Carousel3DProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Register touch handlers via useEffect to keep ref access out of render
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      touchStartRef.current = e.touches[0].clientX;
      setIsDragging(false);
    };

    const onTouchMove = (e: TouchEvent) => {
      const dist = Math.abs(touchStartRef.current - e.touches[0].clientX);
      if (dist >= DRAG_THRESHOLD) {
        setIsDragging(true);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      if (!touch) return;
      const diff = touchStartRef.current - touch.clientX;
      if (Math.abs(diff) < SWIPE_THRESHOLD) return;
      // Dispatch custom event to trigger navigation without ref access
      el.dispatchEvent(
        new CustomEvent("carousel-navigate", {
          detail: { direction: diff > 0 ? "next" : "prev" },
        }),
      );
    };

    const onTouchCancel = () => {
      touchStartRef.current = 0;
      setIsDragging(false);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchCancel);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
    };
  }, []);

  // All navigation through state only — no refs in render path
  const throttledNavigate = useCallback(
    (getNext: (prev: number) => number) => {
      if (isAnimating) return;
      setIsAnimating(true);
      setCurrentIndex(getNext);
      setTimeout(() => setIsAnimating(false), ANIMATION_DURATION);
    },
    [isAnimating],
  );

  const goToIndex = useCallback(
    (index: number) => {
      throttledNavigate((prev) => (prev === index ? prev : index));
    },
    [throttledNavigate],
  );

  const handleNext = useCallback(() => {
    if (items.length === 0) return;
    throttledNavigate((prev) => (prev + 1) % items.length);
  }, [items.length, throttledNavigate]);

  const handlePrev = useCallback(() => {
    if (items.length === 0) return;
    throttledNavigate((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length, throttledNavigate]);

  // Handle touch navigation via custom event (bridges useEffect ref world → state world)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onNavigate = (e: Event) => {
      const { direction } = (e as CustomEvent).detail;
      if (direction === "next") {
        handleNext();
      } else {
        handlePrev();
      }
    };

    el.addEventListener("carousel-navigate", onNavigate);
    return () => el.removeEventListener("carousel-navigate", onNavigate);
  }, [handleNext, handlePrev]);

  const handleItemSelect = useCallback(
    (index: number) => {
      if (isDragging) return;
      goToIndex(index);
    },
    [goToIndex, isDragging],
  );

  // Position resolution uses only state values, no refs
  const positions = items.map((_, index) =>
    getPosition
      ? getPosition(currentIndex, index, items.length)
      : getDefaultPosition(currentIndex, index, items.length, visibleRange, cardSpacing),
  );

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={`relative flex items-center justify-center overflow-visible [perspective:2000px] ${containerClassName}`}
        style={{ height: containerHeight }}
      >
        {items.map((item, index) => {
          const position = positions[index];
          if (!position) return null;

          const key = itemKey ? itemKey(item, index) : index;
          return (
            <React.Fragment key={key}>
              {renderItem({
                item,
                index,
                currentIndex,
                totalItems: items.length,
                position,
                isCenter: index === currentIndex,
                onSelect: handleItemSelect,
              })}
            </React.Fragment>
          );
        })}
      </div>

      {showNavButtons && (
        <>
          <button
            onClick={handlePrev}
            aria-label="이전"
            className="absolute top-1/2 left-0 z-40 hidden -translate-y-1/2 cursor-pointer bg-white/10 p-3 text-white transition-colors hover:bg-white/20 lg:block"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={handleNext}
            aria-label="다음"
            className="absolute top-1/2 right-0 z-40 hidden -translate-y-1/2 cursor-pointer bg-white/10 p-3 text-white transition-colors hover:bg-white/20 lg:block"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {showIndicators && (
        <div className="mt-6 flex justify-center gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              aria-label={`${index + 1}번으로 이동`}
              className={`h-1 transition-all ${index === currentIndex ? "w-6 bg-white" : "w-1 bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
