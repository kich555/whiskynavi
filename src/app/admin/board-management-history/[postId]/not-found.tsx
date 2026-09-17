import Link from "next/link";
import HistoryFrame from "../_components/HistoryFrame";
import { HISTORY_PATH } from "../_lib/history";

export default function NotFound() {
  return (
    <HistoryFrame title="게시글을 찾을 수 없습니다">
      <p className="typo-regular-14 mb-4 text-gray-600">보존된 게시글이 없거나 잘못된 주소입니다.</p>
      <Link href={HISTORY_PATH} className="typo-medium-14 text-amber-700 hover:underline">
        관리기록으로 돌아가기
      </Link>
    </HistoryFrame>
  );
}
