import Link from "next/link";
import { LogoutButton, UserAvatar, UserName } from "./shared";

interface MobileAuthSectionProps {
  userName: string;
  hasSession: boolean;
  isAdmin: boolean;
  isBusiness: boolean;
  close: () => void;
}

export default function MobileAuthSection({
  userName,
  hasSession,
  isAdmin,
  isBusiness,
  close,
}: MobileAuthSectionProps) {
  if (!hasSession) {
    return (
      <div className="flex flex-col gap-1">
        <Link
          href="/sign-in"
          onClick={close}
          className="typo-bold-16 block rounded-lg px-3 py-3 text-white transition-colors hover:bg-white/5"
        >
          로그인
        </Link>
        <Link
          href="/orders/guest"
          onClick={close}
          className="typo-medium-13 rounded-lg px-3 py-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          비회원 주문조회
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="mb-2 flex items-center gap-3 px-3">
        <UserAvatar />
        <UserName name={userName} />
      </div>

      <Link
        href="/my-page"
        onClick={close}
        className="typo-medium-14 rounded-lg px-3 py-3 text-white/80 transition-colors hover:bg-white/5 hover:text-white"
      >
        마이페이지
      </Link>
      {isAdmin ? (
        <Link
          href="/admin"
          onClick={close}
          className="typo-medium-14 rounded-lg px-3 py-3 text-white/80 transition-colors hover:bg-white/5 hover:text-white"
        >
          관리자 페이지
        </Link>
      ) : null}
      {isBusiness ? (
        <Link
          href="/business"
          onClick={close}
          className="typo-medium-14 rounded-lg px-3 py-3 text-white/80 transition-colors hover:bg-white/5 hover:text-white"
        >
          비즈니스 관리
        </Link>
      ) : null}
      <LogoutButton
        onBeforeSignOut={close}
        className="typo-medium-14 cursor-pointer rounded-lg px-3 py-3 text-left text-red-400 transition-colors hover:bg-white/5 hover:text-red-300"
      />
    </div>
  );
}
