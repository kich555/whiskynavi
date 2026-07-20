"use client";

import { getNiceChannelName } from "@/app/(main)/sign-up/nice";
import { NiceVerificationSuccessMessage } from "@/types/auth";
import { useEffect } from "react";

export default function NiceCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const niceSessionId = params.get("niceSessionId");

    if (!niceSessionId) {
      console.error("niceSessionId가 없습니다.");
      window.close();
      return;
    }

    const channel = new BroadcastChannel(getNiceChannelName(niceSessionId));

    const webTransactionId = params.get("web_transaction_id");

    if (!webTransactionId) {
      channel.postMessage({
        type: "nice-verification-error",
        error: "NICE 인증 결과를 확인할 수 없습니다. 다시 시도해주세요.",
      });
      channel.close();
      window.close();
      return;
    }
    const message: NiceVerificationSuccessMessage = {
      type: "nice-verification-success",
      webTransactionId,
    };

    channel.postMessage(message);

    channel.close();
    window.close();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <p className="typo-medium-14 text-gray-600">본인인증 결과를 확인하고 있습니다.</p>
    </main>
  );
}
