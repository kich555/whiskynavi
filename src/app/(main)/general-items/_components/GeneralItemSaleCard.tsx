import { type UserSaleAnnouncementResponse } from "@/apis/generated/api";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { formatCurrency } from "@/lib/formatters";
import { Badge, Link } from "lucide-react";
import { buildGeneralItemSaleDetailHref } from "../_lib/general-item-sales";

const GeneralItemSaleCard = ({ sale, imageUrl }: { sale: UserSaleAnnouncementResponse; imageUrl?: string }) => {
  const remainingQuantity = sale.availableQuantity ?? 0;
  const isSoldOut = remainingQuantity <= 0;
  const itemTitle = sale.title || sale.itemName || "일반상품";

  return (
    <article className="flex h-full flex-col border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/[0.07]">
      <div className="mb-4 flex aspect-square items-center justify-center overflow-hidden bg-black/20">
        {imageUrl ? (
          <ImageWithFallback
            src={imageUrl}
            alt={itemTitle}
            width={320}
            height={320}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="h-full w-full object-contain p-4"
          />
        ) : (
          <div className="px-4 text-center text-sm text-white/45">{itemTitle}</div>
        )}
      </div>

      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="typo-bold-20 line-clamp-2 text-white">{itemTitle}</h2>
        </div>
        <Badge className={`shrink-0 border-transparent text-white ${isSoldOut ? "bg-gray-600" : "bg-green-700"}`}>
          {isSoldOut ? "품절" : "판매중"}
        </Badge>
      </div>

      <div className="space-y-2 border-t border-white/10 pt-4">
        <p className="text-xl font-semibold text-white">{formatCurrency(sale.salePrice)}</p>
        <p className="text-sm text-gray-400">
          {remainingQuantity.toLocaleString("ko-KR")} / {(sale.totalQuantity ?? 0).toLocaleString("ko-KR")}개 남음
        </p>
      </div>

      <div className="mt-auto pt-6">
        {isSoldOut ? (
          <span className="block w-full border border-white/10 px-4 py-3 text-center text-sm font-semibold text-gray-500">
            주문 불가
          </span>
        ) : (
          <Link
            href={buildGeneralItemSaleDetailHref(sale)}
            className="block w-full bg-amber-600 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-amber-700"
          >
            상세보기
          </Link>
        )}
      </div>
    </article>
  );
};

export default GeneralItemSaleCard;
