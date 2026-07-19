import type { AdminBoardResponse } from "@/apis/generated/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export interface BoardFormFieldsProps {
  initialData?: AdminBoardResponse;
}

const ROLE_OPTIONS = [
  { value: "ROLE_GUEST", label: "방문자" },
  { value: "ROLE_USER", label: "일반회원" },
  { value: "ROLE_ADMIN", label: "관리자" },
  { value: "ROLE_SUPER_ADMIN", label: "최고관리자" },
  { value: "ROLE_CONSUMER", label: "소비자" },
  { value: "ROLE_WHISKYNAVI_MEMBER", label: "위스키내비 멤버" },
  { value: "ROLE_WHISKYTALES_MEMBER", label: "위스키테일즈 멤버" },
  { value: "ROLE_BLIND_MEMBER", label: "블라인드 멤버" },
  { value: "ROLE_BUSINESS", label: "사업자" },
  { value: "ROLE_TRAILNTALE_BUSINESS", label: "TrailTale 사업자" },
  { value: "ROLE_COMMUNITY_BUSINESS", label: "커뮤니티 사업자" },
  { value: "ROLE_PICK_UP_BUSINESS", label: "픽업 사업자" },
] as const;

export default function BoardFormFields({ initialData }: BoardFormFieldsProps) {
  return (
    <>
      <div>
        <Label htmlFor="name" className="typo-bold-12 mb-1.5 block text-gray-700">
          게시판명 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={initialData?.name ?? ""}
          maxLength={150}
          required
          placeholder="자유게시판"
        />
      </div>

      <div>
        <Label htmlFor="slug" className="typo-bold-12 mb-1.5 block text-gray-700">
          슬러그 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="slug"
          name="slug"
          type="text"
          defaultValue={initialData?.slug ?? ""}
          maxLength={150}
          required
          pattern="^[a-z0-9-]+$"
          className="font-mono"
          placeholder="free-board"
        />
        <p className="mt-1 typo-medium-12 text-gray-400">영문 소문자, 숫자, 하이픈(-)만 사용 가능</p>
      </div>

      <div>
        <Label htmlFor="description" className="typo-bold-12 mb-1.5 block text-gray-700">
          설명
        </Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initialData?.description ?? ""}
          maxLength={500}
          rows={3}
          className="min-h-[60px] resize-none"
          placeholder="게시판에 대한 설명을 입력하세요."
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 transition-colors has-checked:border-amber-500 has-checked:bg-amber-50">
          <Checkbox name="active" value="true" defaultChecked={initialData?.active ?? true} />
          <div>
            <span className="typo-medium-14 text-gray-900">활성</span>
            <p className="typo-medium-12 text-gray-400">사용자에게 노출</p>
          </div>
        </label>

        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 transition-colors has-checked:border-amber-500 has-checked:bg-amber-50">
          <Checkbox name="hidden" value="true" defaultChecked={initialData?.hidden ?? false} />
          <div>
            <span className="typo-medium-14 text-gray-900">숨김</span>
            <p className="typo-medium-12 text-gray-400">목록에서 숨김</p>
          </div>
        </label>

        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 transition-colors has-checked:border-amber-500 has-checked:bg-amber-50">
          <Checkbox name="readOnly" value="true" defaultChecked={initialData?.readOnly ?? false} />
          <div>
            <span className="typo-medium-14 text-gray-900">읽기전용</span>
            <p className="typo-medium-12 text-gray-400">작성 차단</p>
          </div>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="readRole" className="typo-bold-12 mb-1.5 block text-gray-700">
            읽기 권한
          </Label>
          <input
            type="hidden"
            name="readRole"
            id="readRole-hidden"
            defaultValue={initialData?.readRole ?? "ROLE_GUEST"}
          />
          <Select
            name="readRole"
            defaultValue={initialData?.readRole ?? "ROLE_GUEST"}
            onValueChange={(value) => {
              const hidden = document.getElementById("readRole-hidden") as HTMLInputElement | null;
              if (hidden) hidden.value = value;
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="writeRole" className="typo-bold-12 mb-1.5 block text-gray-700">
            쓰기 권한
          </Label>
          <input
            type="hidden"
            name="writeRole"
            id="writeRole-hidden"
            defaultValue={initialData?.writeRole ?? "ROLE_USER"}
          />
          <Select
            name="writeRole"
            defaultValue={initialData?.writeRole ?? "ROLE_USER"}
            onValueChange={(value) => {
              const hidden = document.getElementById("writeRole-hidden") as HTMLInputElement | null;
              if (hidden) hidden.value = value;
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  );
}
