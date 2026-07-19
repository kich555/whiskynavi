"use client";

import { useActionState, useCallback, useMemo, useRef, useState } from "react";
import AdminHeader from "../../_components/AdminHeader";
import { useSidebar } from "../../_components/AdminLayoutClient";
import { type FormState, updateYoutubeAction } from "../actions";
import { toEmbedUrl } from "../utils";

interface YoutubeContentProps {
  defaultEmbedUrl: string;
}

export default function YoutubeContent({ defaultEmbedUrl }: YoutubeContentProps) {
  const { toggle } = useSidebar();
  const [showSuccess, setShowSuccess] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAction = useCallback(async (prev: FormState, formData: FormData) => {
    const result = await updateYoutubeAction(prev, formData);
    if (result.success) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setShowSuccess(true);
      timerRef.current = setTimeout(() => setShowSuccess(false), 3000);
    }
    return result;
  }, []);

  const [state, formAction, isPending] = useActionState<FormState, FormData>(handleAction, { success: false });

  const [url, setUrl] = useState(defaultEmbedUrl);

  const previewUrl = useMemo(() => toEmbedUrl(url), [url]);

  return (
    <div className="flex-1">
      <AdminHeader title="YouTube 관리" onToggleSidebar={toggle} showSearch={false} />

      <div className="p-8">
        <form action={formAction} className="mx-auto max-w-3xl space-y-8">
          {/* URL Input */}
          <div>
            <label htmlFor="url" className="typo-medium-14 mb-2 block text-gray-700">
              YouTube URL
            </label>
            <input
              id="url"
              name="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <p className="typo-medium-12 mt-1 text-gray-500">
              YouTube 링크를 그대로 붙여넣으세요. (watch, embed, youtu.be, shorts 모두 지원)
            </p>
          </div>

          {/* Preview */}
          {previewUrl ? (
            <div>
              <h3 className="typo-medium-14 mb-3 text-gray-700">미리보기</h3>
              <div className="relative aspect-video overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                <iframe
                  src={previewUrl}
                  title="YouTube 미리보기"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            </div>
          ) : (
            url && <p className="typo-medium-14 text-amber-600">올바른 YouTube URL을 입력해주세요.</p>
          )}

          {/* Error */}
          {state.error && <p className="typo-medium-14 text-red-600">{state.error}</p>}

          {/* Success */}
          {showSuccess && <p className="typo-medium-14 text-green-600">변경되었습니다.</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending || !previewUrl}
            className="typo-medium-14 rounded-lg bg-amber-600 px-6 py-3 text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
          >
            {isPending ? "변경 중..." : "변경"}
          </button>
        </form>
      </div>
    </div>
  );
}
