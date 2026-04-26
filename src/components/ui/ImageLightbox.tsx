"use client";

import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, ZoomIn } from "lucide-react";
import { useState } from "react";

interface ImageLightboxProps {
  src: string;
  alt: string;
  children: React.ReactNode;
}

export function ImageLightbox({ src, alt, children }: ImageLightboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className="group/lightbox relative h-full w-full cursor-zoom-in"
        onClickCapture={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {children}
        {/* Mobile: always-visible badge */}
        <span className="absolute right-1.5 bottom-1.5 flex size-6 items-center justify-center rounded-full bg-black/50 text-white/70 backdrop-blur-sm md:hidden">
          <ZoomIn size={14} />
        </span>
        {/* Desktop: hover overlay */}
        <span className="absolute inset-0 hidden items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover/lightbox:opacity-100 md:flex">
          <ZoomIn size={28} className="text-white drop-shadow-lg" />
        </span>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="w-fit max-w-[90vw] border-white/10 bg-[#1d2429] p-0"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <div className="relative">
            <ImageWithFallback
              src={src}
              alt={alt}
              width={1200}
              height={1200}
              className="block h-auto max-h-[85vh] w-auto max-w-[90vw]"
              sizes="90vw"
            />
            <DialogClose className="absolute top-2 right-2 z-10 flex size-7 items-center justify-center rounded-full bg-black/60 text-white opacity-70 transition-opacity hover:opacity-100">
              <X size={16} />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
