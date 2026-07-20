import { Button } from "@/components/ui/button";
import { CircleAlert } from "lucide-react";
import Link from "next/link";

export default function BusinessNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm md:p-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-100">
          <CircleAlert className="size-7 text-amber-700" aria-hidden="true" />
        </div>

        <p className="typo-bold-16 mt-6 text-amber-700">비즈니스 정보 확인 필요</p>
        <h1 className="typo-bold-24 mt-2 text-gray-900">요청한 비즈니스 정보를 확인할 수 없습니다</h1>
        <p className="typo-regular-14 mt-4 leading-relaxed text-gray-600">
          신청 또는 예약 공고가 삭제되었거나, 현재 선택한 사업장에 조회 권한이 없을 수 있습니다. 주소에 포함된 신청 ID와
          사업장 정보를 확인해주세요.
        </p>

        <div className="mt-6 rounded-xl bg-gray-50 p-4 text-left">
          <p className="typo-bold-14 text-gray-900">다음 내용을 확인해주세요</p>
          <ul className="typo-regular-14 mt-3 list-disc space-y-2 pl-5 leading-relaxed text-gray-600">
            <li>목록에서 신청 또는 공고를 다시 선택했는지</li>
            <li>사이드바에서 올바른 사업장을 선택했는지</li>
            <li>해당 사업장의 소유자 또는 매니저 권한이 있는지</li>
          </ul>
        </div>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/business/pickup-reservations/applications">예약 신청 목록으로</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/business/statistics">비즈니스 홈으로</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
