"use client";

import type { AdminBoardPostTypeResponse } from "@/apis/generated/api";
import DateTimePicker from "@/app/admin/_components/DateTimePicker";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";

interface AnnouncementFormFieldsProps {
  /** usage=ANNOUNCEMENT인 활성 postType 목록. 공지 탭 선택 옵션. */
  postTypeOptions: AdminBoardPostTypeResponse[];
  /** 수정 모드일 때 기존 값. 등록 모드면 undefined. */
  defaultValues?: {
    scope?: string;
    postTypeCode?: string;
    visible?: boolean;
    pinned?: boolean;
    priority?: number;
    publishedAt?: string;
    expiredAt?: string;
  };
}

/**
 * 공지 등록/수정 폼의 제목·내용 외 추가 필드.
 * PostForm의 children으로 주입되어, 제목/내용 아래 submit 버튼 위에 렌더링된다.
 * 모든 필드는 name 속성을 가지며, FormData로 서버 액션에 전달된다.
 */
export default function AnnouncementFormFields({ postTypeOptions, defaultValues }: AnnouncementFormFieldsProps) {
  const initialScope = defaultValues?.scope ?? "BOARD";
  const [scope, setScope] = useState<string>(initialScope);

  // scope가 GLOBAL로 바뀌면 공지 탭 선택이 무의미하므로 비활성화.
  // GLOBAL 공지는 게시판별 postType과 무관하게 전체 적용.
  const isGlobal = scope === "GLOBAL";
  const initialPostTypeCode = defaultValues?.postTypeCode ?? postTypeOptions[0]?.code ?? "";

  // scope가 GLOBAL로 바뀌면 postTypeCode hidden input을 비워 서버에서 undefined 처리 유도
  useEffect(() => {
    if (isGlobal) {
      const hidden = document.getElementById("ann-postTypeCode-hidden") as HTMLInputElement | null;
      if (hidden) hidden.value = "";
    }
  }, [isGlobal]);

  return (
    <div className="mb-4 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ann-scope" className="typo-bold-12 mb-1 block text-gray-700">
            범위
          </Label>
          <input type="hidden" name="scope" id="ann-scope-hidden" defaultValue={initialScope} />
          <Select
            defaultValue={initialScope}
            onValueChange={(value) => {
              const hidden = document.getElementById("ann-scope-hidden") as HTMLInputElement | null;
              if (hidden) hidden.value = value;
              setScope(value);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BOARD">게시판 공지 (이 게시판에만)</SelectItem>
              <SelectItem value="GLOBAL">전체 공지 (모든 게시판)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="ann-postTypeCode" className="typo-bold-12 mb-1 block text-gray-700">
            공지 탭
          </Label>
          <input
            type="hidden"
            name="postTypeCode"
            id="ann-postTypeCode-hidden"
            defaultValue={initialPostTypeCode}
          />
          <Select
            defaultValue={initialPostTypeCode}
            disabled={isGlobal || postTypeOptions.length === 0}
            onValueChange={(value) => {
              const hidden = document.getElementById("ann-postTypeCode-hidden") as HTMLInputElement | null;
              if (hidden) hidden.value = value;
            }}
          >
            <SelectTrigger className="w-full" id="ann-postTypeCode">
              <SelectValue placeholder="공지 탭이 없습니다" />
            </SelectTrigger>
            <SelectContent>
              {postTypeOptions.map((pt) => (
                <SelectItem key={pt.code} value={pt.code!}>
                  {pt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 typo-medium-12 text-gray-400">
            {isGlobal
              ? "전체 공지는 특정 탭에 속하지 않습니다."
              : "이 공지가 표시될 탭을 선택하세요. 공지 탭(ANNOUNCEMENT) postType만 표시됩니다."}
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="ann-priority" className="typo-bold-12 mb-1 block text-gray-700">
          우선순위
        </Label>
        <Input
          id="ann-priority"
          name="priority"
          type="number"
          min={0}
          defaultValue={defaultValues?.priority ?? 0}
        />
        <p className="mt-1 typo-medium-12 text-gray-400">숫자가 클수록 상단에 표시됩니다. 같으면 최신순입니다.</p>
      </div>

      <div className="flex gap-6">
        <label className="flex cursor-pointer items-center gap-2">
          <Checkbox name="visible" value="true" defaultChecked={defaultValues?.visible ?? true} />
          <span className="typo-medium-14 text-gray-700">노출</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <Checkbox name="pinned" value="true" defaultChecked={defaultValues?.pinned ?? false} />
          <span className="typo-medium-14 text-gray-700">상단 고정</span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="typo-bold-12 mb-1 block text-gray-700">예약 게시</Label>
          <DateTimePicker name="publishedAt" defaultValue={defaultValues?.publishedAt} />
          <p className="mt-1 typo-medium-12 text-gray-400">지정 시각이 지나야 공지가 노출됩니다.</p>
        </div>
        <div>
          <Label className="typo-bold-12 mb-1 block text-gray-700">만료</Label>
          <DateTimePicker name="expiredAt" defaultValue={defaultValues?.expiredAt} />
          <p className="mt-1 typo-medium-12 text-gray-400">지정 시각이 지나면 공지가 숨겨집니다.</p>
        </div>
      </div>
    </div>
  );
}
