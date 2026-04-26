"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarDays, Loader2, Upload } from "lucide-react";
import { useActionState, useRef, useState } from "react";
import { submitBusinessApplication } from "../actions";

export default function BusinessApplyForm({ onClose }: { onClose?: () => void }) {
  const [state, formAction, pending] = useActionState(submitBusinessApplication, { success: false });
  const [fileName, setFileName] = useState<string | null>(null);
  const [openingDate, setOpeningDate] = useState<Date>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <form action={formAction} className="space-y-4 md:space-y-6">
      <div>
        <Label htmlFor="businessName" className="typo-bold-14 mb-2 block text-gray-900">
          사업자 이름 *
        </Label>
        <Input
          id="businessName"
          name="businessName"
          type="text"
          required
          placeholder="사업자명을 입력해주세요"
          className="w-full"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="pickupStore" name="pickupStore" value="true" />
        <Label htmlFor="pickupStore" className="typo-medium-14 cursor-pointer text-gray-900">
          픽업매장 등록
        </Label>
      </div>

      <div>
        <Label htmlFor="pickupAddress" className="typo-bold-14 mb-2 block text-gray-900">
          사업장 주소 *
        </Label>
        <Input
          id="pickupAddress"
          name="pickupAddress"
          type="text"
          required
          placeholder="사업장 주소를 입력해주세요"
          className="w-full"
        />
      </div>

      <div>
        <Label htmlFor="contact" className="typo-bold-14 mb-2 block text-gray-900">
          연락처 *
        </Label>
        <Input
          id="contact"
          name="contact"
          type="text"
          required
          placeholder="이메일 또는 전화번호를 입력해주세요"
          className="w-full"
        />
      </div>

      <div>
        <Label className="typo-bold-14 mb-2 block text-gray-900">개업일 *</Label>
        <input type="hidden" name="openingDate" value={openingDate ? format(openingDate, "yyyy-MM-dd") : ""} />
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={`h-auto w-full justify-start px-3 py-2 text-left text-sm font-normal ${
                !openingDate ? "text-gray-400" : "text-gray-900"
              }`}
            >
              <CalendarDays className="mr-2 size-4 text-gray-400" />
              {openingDate ? format(openingDate, "yyyy년 MM월 dd일", { locale: ko }) : "개업일을 선택하세요"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={openingDate}
              onSelect={(day) => {
                setOpeningDate(day);
                setCalendarOpen(false);
              }}
              locale={ko}
            />
          </PopoverContent>
        </Popover>
        {/* required 검증용 숨김 input */}
        {!openingDate && (
          <input tabIndex={-1} className="absolute h-0 w-0 opacity-0" required value="" onChange={() => {}} />
        )}
      </div>

      <div>
        <Label htmlFor="representativeName" className="typo-bold-14 mb-2 block text-gray-900">
          대표자 이름 *
        </Label>
        <Input
          id="representativeName"
          name="representativeName"
          type="text"
          required
          placeholder="대표자 이름을 입력해주세요"
          className="w-full"
        />
      </div>

      <div>
        <Label htmlFor="businessRegistrationNumber" className="typo-bold-14 mb-2 block text-gray-900">
          사업자 등록번호 *
        </Label>
        <Input
          id="businessRegistrationNumber"
          name="businessRegistrationNumber"
          type="text"
          required
          placeholder="사업자 등록번호를 입력해주세요 (예: 123-45-67890)"
          className="w-full"
        />
      </div>

      <div>
        <Label htmlFor="document" className="typo-bold-14 mb-2 block text-gray-900">
          사업자 등록증 *
        </Label>
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-gray-400">
          <input
            ref={fileInputRef}
            id="document"
            name="document"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setFileName(file?.name ?? null);
            }}
            className="hidden"
          />
          <label htmlFor="document" className="block cursor-pointer">
            <Upload className="mx-auto mb-2 text-gray-400" size={32} />
            {fileName ? (
              <div className="space-y-1">
                <p className="typo-medium-14 text-gray-900">{fileName}</p>
                <p className="text-xs text-gray-500">파일을 다시 선택하려면 클릭하세요</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="typo-medium-14 text-gray-900">파일을 선택하세요</p>
                <p className="text-xs text-gray-500">PDF, JPG, PNG (최대 10MB)</p>
              </div>
            )}
          </label>
        </div>
      </div>

      <FormMessage message={state.error} />
      <FormMessage message={state.success ? "사업자 등록 신청이 완료되었습니다." : undefined} variant="success" />

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 bg-gray-900 px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              신청 중...
            </span>
          ) : (
            "등록 신청"
          )}
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}
