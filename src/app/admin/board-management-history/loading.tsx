import HistoryFrame from "./_components/HistoryFrame";

export default function Loading() {
  return (
    <HistoryFrame>
      <div role="status" className="space-y-4" aria-label="관리기록 불러오는 중">
        <p className="typo-medium-14 text-gray-600">관리기록을 불러오고 있습니다.</p>
        <div className="h-32 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
      </div>
    </HistoryFrame>
  );
}
