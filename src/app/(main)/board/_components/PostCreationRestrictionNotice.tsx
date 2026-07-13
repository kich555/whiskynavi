import type { ActivePostCreationRestriction } from "../_lib/post-creation-restriction";

interface PostCreationRestrictionNoticeProps {
  restriction: ActivePostCreationRestriction;
}

export default function PostCreationRestrictionNotice({ restriction }: PostCreationRestrictionNoticeProps) {
  const endAt = new Date(restriction.endAt).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div role="alert" className="rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-100">
      <p className="font-semibold">게시글 작성이 {endAt}까지 제한되었습니다.</p>
      <p className="mt-1 whitespace-pre-wrap text-red-200">사유: {restriction.reason}</p>
    </div>
  );
}
