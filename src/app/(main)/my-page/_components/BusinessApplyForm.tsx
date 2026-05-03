"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addYears, format, isValid, parse } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarDays, Loader2, Upload } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { submitBusinessApplication } from "../actions";

const parseOpeningDate = (value: string): Date | undefined => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;

  const date = parse(value, "yyyy-MM-dd", new Date());
  if (!isValid(date) || format(date, "yyyy-MM-dd") !== value) return undefined;

  return date;
};

const formatOpeningDateInput = (value: string, inputType?: string): string => {
  if (inputType === "deleteContentBackward" && (/^\d{4}$/.test(value) || /^\d{4}-\d{2}$/.test(value))) {
    return value;
  }

  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 3) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 4)}-`;
  if (digits.length <= 5) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
};

export default function BusinessApplyForm({ onClose }: { onClose?: () => void }) {
  const [state, formAction, pending] = useActionState(submitBusinessApplication, { success: false });
  const [fileName, setFileName] = useState<string | null>(null);
  const [openingDate, setOpeningDate] = useState<Date>();
  const [openingDateInput, setOpeningDateInput] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpeningDateSelect = (day?: Date) => {
    if (!day) return;
    setOpeningDate(day);
    setOpeningDateInput(format(day, "yyyy-MM-dd"));
    setCalendarMonth(day);
  };

  const moveCalendarYear = (amount: number) => {
    setCalendarMonth((month) => addYears(month, amount));
  };

  useEffect(() => {
    if (state.success) {
      onClose?.();
    }
  }, [onClose, state.success]);

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
        <Label htmlFor="openingDate" className="typo-bold-14 mb-2 block text-gray-900">
          개업일 *
        </Label>
        <div className="flex gap-2">
          <Input
            id="openingDate"
            name="openingDate"
            type="text"
            inputMode="numeric"
            required
            pattern="\d{4}-\d{2}-\d{2}"
            title="yyyy-MM-dd 형식의 올바른 날짜를 입력해주세요."
            placeholder="yyyy-MM-dd"
            value={openingDateInput}
            onChange={(e) => {
              const inputType = "inputType" in e.nativeEvent ? String(e.nativeEvent.inputType) : undefined;
              const value = formatOpeningDateInput(e.target.value, inputType);
              setOpeningDateInput(value);

              const parsed = parseOpeningDate(value);
              e.currentTarget.setCustomValidity(
                value.length > 0 && value.length !== 10
                  ? "yyyy-MM-dd 형식으로 입력해주세요."
                  : value.length === 10 && !parsed
                    ? "올바른 날짜를 입력해주세요."
                    : "",
              );
              if (parsed) {
                setOpeningDate(parsed);
                setCalendarMonth(parsed);
              } else {
                setOpeningDate(undefined);
              }
            }}
            className="w-full"
          />
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="shrink-0 px-3" aria-label="개업일 달력 열기">
                <CalendarDays className="size-4 text-gray-400" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <div className="mb-2 flex items-center justify-between gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => moveCalendarYear(-1)}>
                  이전 연도
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => moveCalendarYear(1)}>
                  다음 연도
                </Button>
              </div>
              <Calendar
                mode="single"
                selected={openingDate}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                onSelect={(day) => {
                  handleOpeningDateSelect(day);
                  setCalendarOpen(false);
                }}
                captionLayout="dropdown"
                startMonth={new Date(1900, 0)}
                endMonth={new Date()}
                locale={ko}
              />
            </PopoverContent>
          </Popover>
        </div>
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
        <Label htmlFor="businessType" className="typo-bold-14 mb-2 block text-gray-900">
          사업자 구분 *
        </Label>
        <Select name="businessType" defaultValue="HOUSEHOLD" required>
          <SelectTrigger id="businessType" className="w-full">
            <SelectValue placeholder="사업자 구분을 선택해주세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="HOUSEHOLD">가정용</SelectItem>
            <SelectItem value="ENTERTAINMENT">유흥용</SelectItem>
          </SelectContent>
        </Select>
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
