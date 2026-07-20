"use client";

import { overlay } from "overlay-kit";
import { useEffect } from "react";
import LoginPromptModal from "./LoginPromptModal";

export default function UnauthenticatedGuard() {
  useEffect(() => {
    overlay.open(({ isOpen, close }) => <LoginPromptModal isOpen={isOpen} close={close} />);
  }, []);

  return (
    <div className="border border-white/10 bg-white/5 py-20 text-center">
      <p className="mb-4 text-lg text-gray-400">로그인이 필요한 서비스입니다</p>
      <p className="typo-medium-14 text-gray-500">예약 서비스를 이용하시려면 로그인해 주세요.</p>
    </div>
  );
}
