import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-6 border-t border-white/10 bg-[#1d2429] py-6 md:mt-12 md:py-8">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-10">
        <div className="mb-4 flex flex-col justify-between gap-4 border-b border-white/10 pb-4 md:mb-6 md:gap-6 md:pb-6 lg:flex-row">
          <div>
            <p className="mb-1 text-base text-white md:mb-2 md:text-xl">WHISKYNAVI</p>
            <p className="text-[10px] text-gray-400 md:typo-medium-12">대한민국 최초의 독립병입 브랜드</p>
          </div>
          <nav className="typo-medium-12 flex flex-wrap gap-3 text-gray-400 md:gap-4 md:typo-medium-14">
            <Link href="/about" className="transition-colors hover:text-white">
              회사소개
            </Link>
            <Link href="/brand" className="transition-colors hover:text-white">
              브랜드
            </Link>
            <Link href="/archive" className="transition-colors hover:text-white">
              아카이브
            </Link>
            <Link href="/general-items" className="transition-colors hover:text-white">
              일반상품
            </Link>
            <Link href="/reservation" className="transition-colors hover:text-white">
              예약하기
            </Link>
            <Link href="/terms" className="typo-medium-12 text-gray-300 transition-colors hover:text-white">
              이용약관
            </Link>
          </nav>
        </div>

        {/* Desktop: 2 rows - Company info on left, CS on right */}
        <div className="typo-medium-12 hidden space-y-2 text-gray-500 md:block">
          <div className="flex items-center justify-between">
            <span>(주) 캐스크야드 | 대표 천관호 010-6848-6231 | 사업자등록번호 689-86-03712</span>
            <span>캐스크 카니발: www.caskcarnival.com</span>
          </div>
          <div className="flex items-center justify-between">
            <span>(13591) 경기도 성남시 분당구 서현로 210번길 1. 4층 405-자65</span>
            <span className="absolute left-1/2 -translate-x-1/2">Copyright CASKYARD. All rights reserved.</span>
            <span>문의 이메일: contact@whiskynavi.com</span>
          </div>
        </div>

        {/* Mobile: Compact with | separator */}
        <div className="text-[10px] text-gray-500 md:hidden">
          <p className="mb-1">(주) 캐스크야드 | 사업자등록번호: 689-86-03712 | 대표자: 천관호</p>
          <p className="mb-1">주소: (13591) 경기도 성남시 분당구 서현로 210번길 1. 4층 405-자65</p>
          <p className="mb-1">전화번호: 010-6848-6231 | 이메일: contact@whiskynavi.com</p>
          <p>Copyright CASKYARD. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
