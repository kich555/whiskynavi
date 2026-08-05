"use client";

import type { BottleSearchParameterValues } from "@/apis/generated/api";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ArrowLeftRight, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Fragment, useState } from "react";
import { useFilterContext } from "../_context/FilterContext";
import { FILTER_DEFAULTS } from "../_types";
import { NumericRangeInput } from "./ArchiveSidebar/NumericRangeInput";

/**
 * 사이드바의 FilterGroup.Section 제목과 sectionKey를 그대로 따름 (시리즈는 카테고리 작업 시 추가).
 * kind가 range면 고를 목록 없이 입력칸 두 개뿐이라 화면을 넘길 이유가 없다. 항상 제자리에서 펼친다.
 */
const FILTER_SECTIONS = [
  { key: "brand", title: "브랜드", kind: "list" },
  { key: "malt", title: "몰트", kind: "list" },
  { key: "distillery", title: "증류소", kind: "list" },
  { key: "cask", title: "캐스크 종류", kind: "list" },
  { key: "abv", title: "도수", kind: "range" },
  { key: "vintage", title: "빈티지", kind: "range" },
] as const;

type SectionKey = (typeof FILTER_SECTIONS)[number]["key"];
type SectionKind = (typeof FILTER_SECTIONS)[number]["kind"];

/** panel: 항목을 누르면 화면을 넘김 / inline: 제자리에서 펼침. 어느 쪽이 나은지 비교하기 위한 임시 전환 */
type PanelMode = "panel" | "inline";

/** 최상위 목록은 왼쪽으로, 하위 패널은 오른쪽으로 드나들어 단계 이동 방향을 드러냄 */
const PANEL_TRANSITION = { type: "tween", duration: 0.25, ease: "easeOut" } as const;
const EXPAND_TRANSITION = { type: "tween", duration: 0.2, ease: "easeOut" } as const;

interface SectionOptionsProps {
  values: string[];
  selected: string[];
  onToggle: (value: string) => void;
  /** 제자리 펼침일 때는 상위 항목에 딸린 것으로 보이도록 들여씀 */
  indented?: boolean;
}

/** 목록형 필터의 선택지. 패널과 제자리 펼침 양쪽에서 같은 모양을 쓴다. */
function SectionOptions({ values, selected, onToggle, indented = false }: SectionOptionsProps) {
  return values.map((value) => {
    const isSelected = selected.includes(value);
    return (
      <button
        key={value}
        type="button"
        aria-pressed={isSelected}
        onClick={() => onToggle(value)}
        className={`typo-medium-14 w-full shrink-0 cursor-pointer border-b border-white/10 py-4 pr-4 text-left transition-colors ${
          indented ? "pl-8" : "pl-4"
        } ${isSelected ? "bg-white text-black" : "text-white hover:bg-white/5"}`}
      >
        {value}
      </button>
    );
  });
}

/** 사이드바 AbvFilter·VintageFilter와 같은 입력칸 모양 */
const rangeInputClassName =
  "typo-medium-12 h-8 w-full border-white/10 bg-white/5 text-center text-white focus-visible:border-white/20 focus-visible:ring-0";

interface SectionRangeProps {
  value: [number, number];
  min: number;
  max: number;
  unit?: string;
  onChange: (value: [number, number]) => void;
  indented?: boolean;
}

/** 범위 입력형 필터. 고를 목록이 없어 입력칸 두 개만 쓴다. */
function SectionRange({ value, min, max, unit, onChange, indented = false }: SectionRangeProps) {
  return (
    <div
      className={`flex shrink-0 items-center gap-2 border-b border-white/10 py-4 pr-4 ${indented ? "pl-8" : "pl-4"}`}
    >
      <NumericRangeInput
        value={value[0]}
        min={min}
        max={value[1]}
        onChange={(next) => onChange([next, value[1]])}
        className={rangeInputClassName}
      />
      {unit ? <span className="typo-medium-12 shrink-0 text-white/40">{unit}</span> : null}
      <span className="typo-medium-12 shrink-0 text-white/40">~</span>
      <NumericRangeInput
        value={value[1]}
        min={value[0]}
        max={max}
        onChange={(next) => onChange([value[0], next])}
        className={rangeInputClassName}
      />
      {unit ? <span className="typo-medium-12 shrink-0 text-white/40">{unit}</span> : null}
    </div>
  );
}

interface ArchiveFilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  params: BottleSearchParameterValues;
}

export default function ArchiveFilterDrawer({ open, onOpenChange, params }: ArchiveFilterDrawerProps) {
  const { filters, toggleBrand, updateAbv, updateVintage } = useFilterContext();
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);
  const [mode, setMode] = useState<PanelMode>("panel");

  // range형은 전환 버튼과 무관하게 항상 제자리에서 펼친다
  const isInlineSection = (kind: SectionKind) => kind === "range" || mode === "inline";

  // 방식을 바꾸면 열려 있던 항목을 닫아 최상위 상태에서 비교하도록 한다
  const toggleMode = () => {
    setMode((current) => (current === "panel" ? "inline" : "panel"));
    setActiveSection(null);
  };

  // 패널 방식은 들어가면 그 항목만 남고, 제자리 펼침은 같은 항목을 다시 누르면 접힌다
  const handleSectionClick = (key: SectionKey, kind: SectionKind) => {
    setActiveSection((current) => (isInlineSection(kind) && current === key ? null : key));
  };

  // 닫으면 최상위로 되돌려 다음에 열 때 처음부터 보이게 한다.
  // 여는 쪽은 부모 상태로 직접 제어하므로 Radix가 알려주지 않는다.
  const handleOpenChange = (next: boolean) => {
    if (!next) setActiveSection(null);
    onOpenChange(next);
  };

  // 화면을 넘긴 상태일 때만 헤더가 해당 항목 이름과 뒤로가기를 보여준다
  const activeMeta = FILTER_SECTIONS.find((section) => section.key === activeSection);
  const openedPanel = activeMeta && !isInlineSection(activeMeta.kind) ? activeMeta.key : null;
  const activeTitle = openedPanel ? activeMeta?.title : undefined;

  const renderOptions = (key: SectionKey, indented: boolean) => {
    switch (key) {
      case "brand":
        return (
          <SectionOptions
            values={params.brands ?? []}
            selected={filters.brands}
            onToggle={toggleBrand}
            indented={indented}
          />
        );
      case "abv":
        return (
          <SectionRange
            value={filters.abv}
            min={FILTER_DEFAULTS.ABV_MIN}
            max={FILTER_DEFAULTS.ABV_MAX}
            unit="%"
            onChange={updateAbv}
            indented={indented}
          />
        );
      case "vintage":
        return (
          <SectionRange
            value={filters.vintage}
            min={FILTER_DEFAULTS.VINTAGE_MIN}
            max={FILTER_DEFAULTS.VINTAGE_MAX}
            onChange={updateVintage}
            indented={indented}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="left" className="w-4/5 border-white/10 bg-[#1d2429] sm:max-w-sm">
        <SheetHeader>
          <div className="flex items-center gap-2">
            {openedPanel ? (
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
            <button
              type="button"
              aria-label={mode === "panel" ? "제자리 펼침 방식으로 전환" : "화면 이동 방식으로 전환"}
              onClick={toggleMode}
              className="cursor-pointer text-white/50 transition-colors hover:text-white"
            >
              <ArrowLeftRight className="size-4" />
            </button>
          </div>
        </SheetHeader>

        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence initial={false}>
            {openedPanel === null ? (
              <motion.nav
                key="root"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={PANEL_TRANSITION}
                className="absolute inset-0 flex flex-col overflow-y-auto"
              >
                {FILTER_SECTIONS.map(({ key, title, kind }) => {
                  const inline = isInlineSection(kind);
                  const isExpanded = inline && activeSection === key;
                  return (
                    <Fragment key={key}>
                      <button
                        type="button"
                        aria-expanded={inline ? isExpanded : undefined}
                        onClick={() => handleSectionClick(key, kind)}
                        className="typo-medium-14 flex shrink-0 cursor-pointer items-center justify-between border-b border-white/10 px-4 py-4 text-white transition-colors hover:bg-white/5"
                      >
                        {title}
                        {inline ? (
                          <ChevronDown
                            className={`size-4 text-white/50 transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        ) : (
                          <ChevronRight className="size-4 text-white/50" />
                        )}
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded ? (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={EXPAND_TRANSITION}
                            className="shrink-0 overflow-hidden"
                          >
                            {renderOptions(key, true)}
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </Fragment>
                  );
                })}
              </motion.nav>
            ) : (
              <motion.div
                key={openedPanel}
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={PANEL_TRANSITION}
                className="absolute inset-0 flex flex-col overflow-y-auto"
              >
                {renderOptions(openedPanel, false)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
