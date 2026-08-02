import { BottleResponse } from "@/apis/generated/api";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { formatCurrency } from "@/lib/formatters";
import Link from "next/link";

interface Props {
  bottle: BottleResponse;
}
const BottleCard = ({ bottle }: Props) => {
  return (
    <div className="group border border-white/10 p-2.5 pb-1.5 text-left transition-colors hover:bg-white/5 sm:p-4 sm:pb-2">
      <div className="relative mb-2 flex aspect-square items-center justify-center">
        {bottle.imgUrl ? (
          <ImageLightbox src={bottle.imgUrl} alt={bottle.name ?? ""}>
            <ImageWithFallback
              src={bottle.imgUrl}
              alt={bottle.name ?? ""}
              fill
              className="object-contain p-1.5 sm:p-4"
            />
          </ImageLightbox>
        ) : (
          <Link href={`/archive/${bottle.id}`} className="typo-medium-14 text-white/60 md:text-base">
            {bottle.name}
          </Link>
        )}
      </div>

      <Link href={`/archive/${bottle.id}`} className="block">
        <p className="typo-medium-12 text-gray-400">{bottle.brand ?? bottle.company ?? ""}</p>
        <h3
          className="typo-medium-14 mt-2 line-clamp-2 text-white group-hover:text-gray-300"
          style={{ lineHeight: 1.4 }}
        >
          {bottle.name}
        </h3>
        {(bottle.supplyPrice != null || bottle.consumerPrice != null) && (
          <dl className="mt-2 space-y-1 border-t border-white/10 pt-2">
            {bottle.supplyPrice != null && (
              <div className="flex items-center justify-between gap-2">
                <dt className="typo-medium-10 text-gray-500">공급가</dt>
                <dd className="typo-bold-12 text-white">{formatCurrency(bottle.supplyPrice)}</dd>
              </div>
            )}
            {bottle.consumerPrice != null && (
              <div className="flex items-center justify-between gap-2">
                <dt className="typo-medium-10 text-gray-500">권장소매가</dt>
                <dd className="typo-medium-12 text-gray-300">{formatCurrency(bottle.consumerPrice)}</dd>
              </div>
            )}
          </dl>
        )}
        <div className="mt-2 flex items-center justify-between">
          <span className="typo-medium-12 text-gray-500">{bottle.distillery ?? ""}</span>
          {bottle.abv != null && <span className="typo-medium-12 text-gray-400">{bottle.abv}%</span>}
        </div>
      </Link>
    </div>
  );
};

export default BottleCard;
