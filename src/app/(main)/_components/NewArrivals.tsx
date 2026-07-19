import type { BottleResponse } from "@/apis/generated/api";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import BottleCard from "./BottleCard";

interface Props {
  bottles: BottleResponse[];
}

const NewArrivals = ({ bottles }: Props) => {
  return (
    <section className="py-6 md:py-12">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-10">
        <div className="mb-4 md:mb-8">
          <h2 className="mb-1 text-lg font-bold text-white md:mb-2 md:text-2xl">NEW ARRIVALS</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4 lg:gap-8">
          {bottles.map((bottle) => (
            <BottleCard key={bottle.id} bottle={bottle} />
          ))}
        </div>

        <div className="mt-4 text-center md:mt-8">
          <Link href="/archive">
            <span className="typo-medium-12 inline-flex items-center gap-2 bg-white/90 px-5 py-2 text-black transition-all hover:bg-white md:px-6 md:py-2.5 md:typo-medium-14">
              전체 제품 보기
              <ArrowRight size={14} className="md:size-4" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;
