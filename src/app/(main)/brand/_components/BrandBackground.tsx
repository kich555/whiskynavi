import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { memo } from "react";

const BrandBackground = memo(function BrandBackground({ bgImage, name }: { bgImage: string; name: string }) {
  return (
    <div className="absolute inset-0 right-0 left-0 mx-auto max-w-[1440px]">
      <div className="absolute inset-0 overflow-hidden">
        <ImageWithFallback
          key={bgImage}
          src={bgImage}
          alt={name}
          className="h-full w-full animate-in fade-in-0 object-contain duration-700 ease-out"
          width={1440}
          height={480}
        />
        <div className="absolute inset-0 bg-linear-to-b from-[#1d2429] via-[#1d2429]/60 to-[#1d2429]"></div>
        <div className="absolute inset-0 bg-linear-to-r from-[#1d2429] via-transparent to-[#1d2429]"></div>
      </div>
    </div>
  );
});

export default BrandBackground;
