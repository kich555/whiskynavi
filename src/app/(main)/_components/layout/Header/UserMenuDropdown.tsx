import Link from "next/link";
import { LogoutButton } from "./shared";

interface UserMenuDropdownProps {
  close: () => void;
  anchorRect?: DOMRect;
  isAdminUser: boolean;
  isBusinessUser: boolean;
}

export default function UserMenuDropdown({ close, anchorRect, isAdminUser, isBusinessUser }: UserMenuDropdownProps) {
  const top = anchorRect ? anchorRect.bottom + 8 : 80;
  const right = anchorRect ? window.innerWidth - anchorRect.right : 32;

  return (
    <>
      <div className="fixed inset-0 z-60" onClick={close} />
      <div
        className="fixed z-60 w-44 rounded-lg border border-white/20 bg-[#1d2429] py-2 shadow-2xl backdrop-blur-md"
        style={{ top, right }}
      >
        <Link
          href="/my-page"
          onClick={close}
          className="typo-regular-14 block px-4 py-2.5 text-white/90 transition-colors hover:bg-white/10 hover:text-white"
        >
          마이페이지
        </Link>
        {isAdminUser ? (
          <Link
            href="/admin"
            onClick={close}
            className="typo-regular-14 block px-4 py-2.5 text-white/90 transition-colors hover:bg-white/10 hover:text-white"
          >
            관리자 페이지
          </Link>
        ) : null}
        {isBusinessUser ? (
          <Link
            href="/business"
            onClick={close}
            className="typo-regular-14 block px-4 py-2.5 text-white/90 transition-colors hover:bg-white/10 hover:text-white"
          >
            비즈니스 관리
          </Link>
        ) : null}
        <div className="my-1 border-t border-white/10" />
        <LogoutButton
          onBeforeSignOut={close}
          className="typo-regular-14 block w-full cursor-pointer px-4 py-2.5 text-left text-red-400 transition-colors hover:bg-white/10 hover:text-red-300"
        />
        {/* TODO: 다국어 지원 시 언어 선택 메뉴 항목 추가 */}
      </div>
    </>
  );
}
