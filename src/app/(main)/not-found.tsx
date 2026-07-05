import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mt-20 flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <Image src="/whiskynavi-logo.png" alt="WhiskyNavi" width={60} height={76} priority />
      <p className="typo-bold-40 mt-6 text-white">404</p>
      <h2 className="typo-bold-20 mt-2 text-white">잘못 찾아오신 것 같아요</h2>
      <p className="typo-regular-14 mt-3 text-gray-500">입력하신 주소가 정확한지 다시 한번 확인해주세요.</p>
      <Button asChild className="mt-6 bg-amber-600 hover:bg-amber-700">
        <Link href="/">홈으로 돌아가기</Link>
      </Button>
    </div>
  );
}
