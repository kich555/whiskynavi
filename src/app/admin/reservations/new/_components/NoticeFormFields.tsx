"use client";

import { postApiS3Upload } from "@/apis/generated/api";
import type { AdminBottleReservationNoticeResponse } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import RichTextImageEditor from "@/components/editor/RichTextImageEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildCloudFrontUrl } from "@/lib/cloudfront";
import { Plus, X } from "lucide-react";
import { getSession } from "next-auth/react";
import { useCallback, useState } from "react";
import CurrencyInput from "../../../_components/CurrencyInput";
import DateTimePicker from "../../../_components/DateTimePicker";
import { ROLE_LABEL_MAP } from "../../../constants";
import type { NoticeFormValues } from "../../actions";
import BottleSearchCombobox from "./BottleSearchCombobox";

const ROLE_OPTIONS = Object.entries(ROLE_LABEL_MAP) as [string, string][];

interface GradeCondition {
  applicableFrom: string;
  requiredRole: string;
}

interface NoticeFormFieldsProps {
  defaultValues?: AdminBottleReservationNoticeResponse;
  formValues?: NoticeFormValues;
  onUploadingChange?: (uploading: boolean) => void;
}

export default function NoticeFormFields({ defaultValues, formValues, onUploadingChange }: NoticeFormFieldsProps) {
  const isEditing = defaultValues?.id != null;
  const [uploading, setUploading] = useState(false);
  const handleUploadingChange = useCallback(
    (next: boolean) => {
      setUploading(next);
      onUploadingChange?.(next);
    },
    [onUploadingChange],
  );
  const uploadFn = useCallback(async (file: File): Promise<string> => {
    const session = await getSession();
    if (!session?.accessToken) throw new Error("로그인이 필요합니다.");
    const response = await postApiS3Upload({ file }, withToken(session.accessToken));
    const key = response.data.key;
    if (!key) throw new Error("업로드된 이미지 키를 확인할 수 없습니다.");
    return buildCloudFrontUrl(key);
  }, []);
  const [gradeConditions, setGradeConditions] = useState<GradeCondition[]>(
    formValues?.gradeConditions ??
      defaultValues?.gradeConditions?.map((gc) => ({
        applicableFrom: gc.applicableFrom ?? "",
        requiredRole: gc.requiredRole ?? "",
      })) ??
      [],
  );

  const addCondition = () => {
    setGradeConditions((prev) => [...prev, { applicableFrom: "", requiredRole: "" }]);
  };

  const removeCondition = (idx: number) => {
    setGradeConditions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateCondition = (idx: number, field: keyof GradeCondition, value: string) => {
    setGradeConditions((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <input
        type="hidden"
        name="gradeConditions"
        value={
          gradeConditions.length > 0
            ? JSON.stringify(
                gradeConditions.map((c) => ({
                  applicableFrom: c.applicableFrom,
                  requiredRole: c.requiredRole,
                })),
              )
            : ""
        }
      />

      <div>
        <label className="typo-medium-14 mb-1 block text-gray-700">공고명</label>
        <input
          type="text"
          name="noticeName"
          maxLength={200}
          defaultValue={formValues?.noticeName ?? defaultValues?.noticeName ?? ""}
          className="typo-medium-14 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          placeholder="예: 7월 한정공고"
        />
      </div>

      <div className="mt-2 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="typo-medium-14 mb-1 block text-gray-700">
            제품 <span className="text-red-500">*</span>
          </label>
          <BottleSearchCombobox
            defaultBottle={
              formValues?.bottleId
                ? {
                    id: Number(formValues.bottleId),
                    name: formValues.bottleName || `ID: ${formValues.bottleId}`,
                  }
                : defaultValues?.bottleId != null && defaultValues?.bottleName != null
                  ? {
                      id: defaultValues.bottleId,
                      name: defaultValues.bottleName,
                    }
                  : undefined
            }
          />
        </div>

        <div>
          <label className="typo-medium-14 mb-1 block text-gray-700">
            가격 <span className="text-red-500">*</span>
          </label>
          <CurrencyInput
            name="price"
            defaultValue={formValues?.price ?? defaultValues?.price}
            required
            className="typo-medium-14 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            placeholder="가격을 입력하세요"
          />
        </div>

        <div>
          <label className="typo-medium-14 mb-1 block text-gray-700">
            {isEditing ? "남은 수락 수량" : "총 수락할 수량"}
          </label>
          {isEditing && defaultValues?.approvedQuantity != null && (
            <p className="typo-medium-12 mb-1 text-gray-500">현재 수락한 수량 {defaultValues.approvedQuantity}병</p>
          )}
          <input
            type="number"
            name="availableQuantity"
            min={0}
            step={1}
            defaultValue={formValues?.availableQuantity ?? defaultValues?.availableQuantity ?? ""}
            className="typo-medium-14 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            placeholder="예: 100"
          />
        </div>

        <div>
          <label className="typo-medium-14 mb-1 block text-gray-700">인당 최대 예약 가능 병수</label>
          <input
            type="number"
            name="maxOrderQuantity"
            min={0}
            step={1}
            defaultValue={formValues?.maxOrderQuantity ?? defaultValues?.maxOrderQuantity ?? ""}
            className="typo-medium-14 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            placeholder="예: 2"
          />
        </div>

        <div>
          <label className="typo-medium-14 mb-1 block text-gray-700">
            예약 시작일 <span className="text-red-500">*</span>
          </label>
          <DateTimePicker
            name="reservationStartAt"
            defaultValue={formValues?.reservationStartAt ?? defaultValues?.reservationStartAt}
            required
          />
        </div>

        <div>
          <label className="typo-medium-14 mb-1 block text-gray-700">
            예약 종료일 <span className="text-red-500">*</span>
          </label>
          <DateTimePicker
            name="reservationEndAt"
            defaultValue={formValues?.reservationEndAt ?? defaultValues?.reservationEndAt}
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="typo-medium-14 mb-1 block text-gray-700">설명</label>
          <RichTextImageEditor
            name="description"
            variant="admin"
            defaultValue={formValues?.description ?? defaultValues?.description ?? ""}
            placeholder="예약 공고에 대한 설명을 입력하세요"
            uploadFn={uploadFn}
            onUploadingChange={handleUploadingChange}
          />
          {uploading && (
            <p className="typo-medium-12 mt-1 text-amber-600">이미지 업로드 중입니다. 완료 후 저장하세요.</p>
          )}
        </div>
      </div>

      {/* 등급 조건 */}
      <div className="mt-6 border-t border-gray-200 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <label className="typo-medium-14 text-gray-700">등급 조건 (선택)</label>
          <button
            type="button"
            onClick={addCondition}
            className="typo-medium-12 flex cursor-pointer items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-white transition-colors hover:bg-amber-700"
          >
            <Plus size={14} />
            조건 추가
          </button>
        </div>

        {gradeConditions.length === 0 && <p className="typo-medium-14 text-gray-400">등급 조건이 없습니다.</p>}

        <div className="space-y-3">
          {gradeConditions.map((cond, idx) => (
            <div key={idx} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <div className="flex-1">
                <label className="typo-medium-12 mb-1 block text-gray-500">역할</label>
                <Select
                  value={cond.requiredRole || undefined}
                  onValueChange={(val) => updateCondition(idx, "requiredRole", val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map(([role, label]) => (
                      <SelectItem key={role} value={role}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="typo-medium-12 mb-1 block text-gray-500">적용 시작일</label>
                <DateTimePicker
                  value={cond.applicableFrom}
                  onChange={(iso) => updateCondition(idx, "applicableFrom", iso)}
                />
              </div>

              <button
                type="button"
                onClick={() => removeCondition(idx)}
                className="mt-5 cursor-pointer rounded-md p-1.5 text-red-600 transition-colors hover:bg-red-50"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
