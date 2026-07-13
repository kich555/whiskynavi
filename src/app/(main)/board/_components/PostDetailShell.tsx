import { ReactNode } from "react";

interface PostDetailShellProps {
  /** 헤더 영역 (제목, 메타 정보 등) */
  header: ReactNode;
  /** 본문 HTML */
  content: string;
  /** 하단 액션 영역 (수정/삭제 버튼 등) */
  actions?: ReactNode;
  /** 뒤로가기 링크 href. 기본값은 community 목록. */
  backHref?: string;
}

/**
 * 게시글/공지사항 상세 페이지의 공통 레이아웃을 제공하는 Shell 컴포넌트.
 * 뒤로가기 링크, 카드 박스, 본문 prose 스타일을 고정으로 렌더링하고
 * header/content/actions는 props로 주입받는다.
 */
export default function PostDetailShell({
  header,
  content,
  actions,
  backHref = "/board/community",
}: PostDetailShellProps) {
  return (
    <div className="mx-auto mt-20 max-w-[1440px] bg-[#1d2429]">
      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* 뒤로가기 */}
        <a href={backHref} className="mb-4 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white">
          ← 목록으로
        </a>

        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
          {/* 헤더 */}
          <div className="border-b border-white/10 px-5 pt-5 pb-3">{header}</div>

          {/* 본문 (TipTap HTML) */}
          <div
            className="post-rich-text max-w-none px-5 py-5 text-sm text-white [&_img]:my-4 [&_img]:rounded-lg [&_img]:text-transparent [&_p]:min-h-[1.5em]"
            dangerouslySetInnerHTML={{ __html: content }}
          />

          {/* 액션 */}
          {actions && <div className="flex items-center gap-3 border-t border-white/10 px-5 pt-4 pb-5">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
