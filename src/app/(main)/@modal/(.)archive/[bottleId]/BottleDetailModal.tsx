"use client";

import type { BottleResponse } from "@/apis/generated/api";
import RichTextContent from "@/components/editor/RichTextContent";
import RepresentativeImageCarousel from "@/components/media/RepresentativeImageCarousel";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { sanitizeRichTextContent } from "@/lib/rich-text";
import { useRouter } from "next/navigation";

interface Props {
  bottle: BottleResponse;
}

export default function BottleDetailModal({ bottle }: Props) {
  const router = useRouter();

  return (
    <Dialog
      defaultOpen
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <DialogContent
        className="max-h-[90vh] max-w-[95vw] overflow-y-auto border-white/10 bg-[#1d2429] p-4 sm:max-w-3xl sm:p-6 [&_[data-slot=dialog-close]]:text-white"
        showCloseButton
      >
        <DialogTitle className="typo-bold-20 text-white lg:text-2xl">{bottle.name}</DialogTitle>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Image */}
          <RepresentativeImageCarousel
            images={[bottle.imgUrl, ...(bottle.imageUrls ?? [])]}
            alt={bottle.name ?? "보틀"}
            surfaceClassName="border border-white/10 bg-[#1d2429]"
            emptyContent={<div className="text-2xl text-white/60">{bottle.name}</div>}
          />

          {/* Info */}
          <div className="space-y-3">
            {[
              { label: "브랜드", value: bottle.brand },
              { label: "증류소", value: bottle.distillery },
              { label: "몰트 타입", value: bottle.maltType },
              {
                label: "도수",
                value: bottle.abv != null ? `${bottle.abv}%` : undefined,
              },
              { label: "캐스크", value: bottle.caskType },
              { label: "캐스크 No.", value: bottle.caskNumber },
              { label: "증류일", value: bottle.distillationDate },
              { label: "병입일", value: bottle.bottledDate },
              {
                label: "용량",
                value: bottle.capacity != null ? `${bottle.capacity}ml` : undefined,
              },
            ].map((item, index, arr) => (
              <div
                key={item.label}
                className={`flex items-center justify-between gap-2 pb-2 ${
                  index < arr.length - 1 ? "border-b border-white/10" : ""
                }`}
              >
                <span className="typo-medium-14 whitespace-nowrap text-gray-400">{item.label}</span>
                <span className="typo-medium-14 text-right text-white">{item.value || "-"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tasting Note */}
        {bottle.description && (
          <div className="mt-4">
            <h3 className="typo-bold-18 mb-3 text-white">테이스팅 노트</h3>
            <div className="border border-white/10 p-4">
              <RichTextContent
                html={sanitizeRichTextContent(bottle.description)}
                className="typo-medium-14 leading-relaxed text-gray-300"
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
