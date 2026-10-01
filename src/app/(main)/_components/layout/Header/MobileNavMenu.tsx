"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Menu, ShoppingCart } from "lucide-react";
import { Session } from "next-auth";
import Link from "next/link";
import { overlay } from "overlay-kit";
import { FC } from "react";
import { hasSession, isAdminUser, isBusinessUser } from "../utils";
import { AUTH_NAV_LINKS, NAV_LINKS } from "./constants";
import MobileAuthSection from "./MobileAuthSection";

interface Props {
  session: Session | null;
  pathname: string;
}

const MobileNavMenu: FC<Props> = ({ session, pathname }) => {
  return (
    <div className="flex items-center gap-2 lg:hidden">
      <Link
        href="/general-items/cart"
        aria-label="일반상품 장바구니"
        title="일반상품 장바구니"
        className="flex size-11 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        <ShoppingCart size={22} aria-hidden="true" />
      </Link>
      <button
        type="button"
        onClick={() =>
          overlay.open(({ isOpen, close }) => (
            <Sheet
              open={isOpen}
              onOpenChange={(open) => {
                if (!open) close();
              }}
            >
              <SheetContent side="right" className="w-4/5 border-white/10 bg-[#1d2429] sm:max-w-sm">
                <SheetHeader>
                  <SheetTitle className="text-white">메뉴</SheetTitle>
                </SheetHeader>

                <nav className="flex flex-1 flex-col gap-1 px-4">
                  {NAV_LINKS.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={close}
                      className={`typo-bold-16 rounded-lg px-3 py-3 transition-colors ${
                        pathname.startsWith(href)
                          ? "bg-white/10 text-white"
                          : "text-white/80 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {label}
                    </Link>
                  ))}
                  {session &&
                    AUTH_NAV_LINKS.map(({ href, label }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={close}
                        className={`typo-bold-16 rounded-lg px-3 py-3 transition-colors ${
                          pathname.startsWith(href)
                            ? "bg-white/10 text-white"
                            : "text-white/80 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {label}
                      </Link>
                    ))}
                </nav>

                <div className="border-t border-white/10 p-4">
                  <MobileAuthSection
                    userName={session?.user?.name ?? ""}
                    hasSession={hasSession(session)}
                    isAdmin={isAdminUser(session)}
                    isBusiness={isBusinessUser(session)}
                    close={close}
                  />
                </div>

                {/* TODO: 다국어 지원 시 활성화
                <div className="border-t border-white/10 px-4 pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 text-white/70">
                      <Globe size={18} />
                      <span className="typo-bold-14">언어 선택</span>
                    </div>
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => { changeLanguage(lang.code); close(); }}
                        className={`typo-regular-14 w-full rounded-lg py-2 pl-10 text-left transition-colors ${
                          currentLanguage === lang.code
                            ? "text-white"
                            : "text-white/60 hover:text-white/80"
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div> */}
              </SheetContent>
            </Sheet>
          ))
        }
        className="cursor-pointer text-white lg:hidden"
        aria-label="메뉴 열기"
      >
        <Menu size={24} />
      </button>
    </div>
  );
};

export default MobileNavMenu;
