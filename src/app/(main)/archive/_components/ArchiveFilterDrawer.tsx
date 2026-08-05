"use client";

import type { BottleSearchParameterValues } from "@/apis/generated/api";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useFilterContext } from "../_context/FilterContext";

/** 사이드바의 FilterGroup.Section 제목과 sectionKey를 그대로 따름 (시리즈는 카테고리 작업 시 추가) */
const FILTER_SECTIONS = [
  { key: "brand", title: "브랜드" },
  { key: "malt", title: "몰트" },
  { key: "distillery", title: "증류소" },
  { key: "cask", title: "캐스크 종류" },
  { key: "abv", title: "도수" },
  { key: "vintage", title: "빈티지" },
] as const;

type SectionKey = (typeof FILTER_SECTIONS)[number]["key"];

/** 최상위 목록은 왼쪽으로, 하위 패널은 오른쪽으로 드나들어 단계 이동 방향을 드러냄 */
const PANEL_TRANSITION = { type: "tween", duration: 0.25, ease: "easeOut" } as const;

interface ArchiveFilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  params: BottleSearchParameterValues;
}

export default function ArchiveFilterDrawer({ open, onOpenChange, params }: ArchiveFilterDrawerProps) {
  const { filters, toggleBrand } = useFilterContext();
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);

  const activeTitle = FILTER_SECTIONS.find((section) => section.key === activeSection)?.title;

  // 닫으면 최상위로 되돌려 다음에 열 때 처음부터 보이게 한다.
  // 여는 쪽은 부모 상태로 직접 제어하므로 Radix가 알려주지 않는다.
  const handleOpenChange = (next: boolean) => {
    if (!next) setActiveSection(null);
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="left" className="w-4/5 border-white/10 bg-[#1d2429] sm:max-w-sm">
        <SheetHeader>
          <div className="flex items-center gap-2">
            {activeSection ? (
              <button
                type="button"
                aria-label="이전으로"
                onClick={() => setActiveSection(null)}
                className="cursor-pointer text-white"
              >
                <ChevronLeft className="size-5" />
              </button>
            ) : null}
            <SheetTitle className="text-white">{activeTitle ?? "필터"}</SheetTitle>
          </div>
        </SheetHeader>

        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence initial={false}>
            {activeSection === null ? (
              <motion.nav
                key="root"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={PANEL_TRANSITION}
                className="absolute inset-0 flex flex-col overflow-y-auto"
              >
                {FILTER_SECTIONS.map(({ key, title }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveSection(key)}
                    className="typo-medium-14 flex shrink-0 cursor-pointer items-center justify-between border-b border-white/10 px-4 py-4 text-white transition-colors hover:bg-white/5"
                  >
                    {title}
                    <ChevronRight className="size-4 text-white/50" />
                  </button>
                ))}
              </motion.nav>
            ) : (
              <motion.div
                key={activeSection}
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={PANEL_TRANSITION}
                className="absolute inset-0 flex flex-col overflow-y-auto"
              >
                {activeSection === "brand"
                  ? (params.brands ?? []).map((brand) => {
                      const isSelected = filters.brands.includes(brand);
                      return (
                        <button
                          key={brand}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => toggleBrand(brand)}
                          className={`typo-medium-14 w-full shrink-0 cursor-pointer border-b border-white/10 px-4 py-4 text-left transition-colors ${
                            isSelected ? "bg-white text-black" : "text-white hover:bg-white/5"
                          }`}
                        >
                          {brand}
                        </button>
                      );
                    })
                  : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
