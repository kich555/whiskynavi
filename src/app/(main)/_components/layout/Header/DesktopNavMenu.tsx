"use client";

import { ShoppingCart } from "lucide-react";
import { Session } from "next-auth";
import Link from "next/link";
import { overlay } from "overlay-kit";
import { FC, useRef } from "react";
import { hasSession, isAdminUser, isBusinessUser } from "../utils";
import { AUTH_NAV_LINKS, NAV_LINKS } from "./constants";
import DesktopAuthArea from "./DesktopAuthArea";
import UserMenuDropdown from "./UserMenuDropdown";

interface Props {
  session: Session | null;
  pathname: string;
}

const DesktopNavMenu: FC<Props> = ({ session, pathname }) => {
  const authAreaRef = useRef<HTMLDivElement>(null);

  const openUserMenu = () => {
    const rect = authAreaRef.current?.getBoundingClientRect();
    overlay.open(({ isOpen, close }) =>
      isOpen ? (
        <UserMenuDropdown
          isAdminUser={isAdminUser(session)}
          isBusinessUser={isBusinessUser(session)}
          close={close}
          anchorRect={rect}
        />
      ) : null,
    );
  };

  return (
    <>
      <nav className="hidden items-center gap-12 lg:flex">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`typo-bold-18 transition-colors ${
              pathname.startsWith(href) ? "text-white" : "text-white/80 hover:text-white"
            }`}
          >
            {label}
          </Link>
        ))}
        {hasSession(session) &&
          AUTH_NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`typo-bold-18 transition-colors ${
                pathname.startsWith(href) ? "text-white" : "text-white/80 hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
      </nav>
      <div ref={authAreaRef} className="hidden items-center gap-4 lg:flex">
        <Link
          href="/general-items/cart"
          aria-label="일반상품 장바구니"
          title="일반상품 장바구니"
          className="flex size-11 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ShoppingCart size={22} aria-hidden="true" />
        </Link>
        {/* TODO: 다국어 지원 시 Globe 버튼 + overlay.open으로 언어 선택 드롭다운 구현 */}
        <DesktopAuthArea onOpenUserMenu={openUserMenu} />
      </div>
    </>
  );
};

export default DesktopNavMenu;
