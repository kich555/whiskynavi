"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="bg-[#1D2429]">
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center text-white">
          <h2 className="text-xl font-bold">페이지를 불러올 수 없습니다</h2>
          <p className="mt-3 text-sm text-gray-400">일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
          <button
            onClick={reset}
            className="mt-6 border border-white/20 bg-white/10 px-4 py-2 text-sm transition-colors hover:bg-white/20"
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
