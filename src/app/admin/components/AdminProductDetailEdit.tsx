"use client";

import { postApiS3Upload, type BottleAdminParameterValues, type BottleAdminResponse } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import RichTextImageEditor from "@/components/editor/RichTextImageEditor";
import { Label } from "@/components/ui/label";
import { buildCloudFrontUrl } from "@/lib/cloudfront";
import { getImageSizeError } from "@/lib/image-upload";
import { CalendarDays, Plus, Upload, X } from "lucide-react";
import { getSession } from "next-auth/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CurrencyInput from "../_components/CurrencyInput";
import { MAX_BOTTLE_IMAGE_SIZE_MB } from "../products/image-constraints";
import ParameterCombobox from "./ParameterCombobox";

interface AdminProductDetailEditProps {
  defaultValues?: BottleAdminResponse;
  submittedValues?: Record<string, string>;
  parameterValues?: BottleAdminParameterValues;
  selectedFile: File | null;
  onSelectFile: (file: File | null) => void;
  onDescriptionUploadingChange?: (uploading: boolean) => void;
}

const FALLBACK_IMAGE = "/default-bottle-v2.png";

function pickDefault(
  submitted: Record<string, string> | undefined,
  key: string,
  fallback: string | number | undefined,
): string | number | undefined {
  if (submitted && key in submitted) return submitted[key];
  return fallback;
}

function pickDefaultVisible(submitted: Record<string, string> | undefined, fallback: boolean | undefined): boolean {
  if (submitted && "visible" in submitted) return submitted.visible === "on";
  return fallback ?? true;
}

// API 선택지를 보여주되 관리자가 직접 입력하는 흐름은 그대로 유지한다.

export default function AdminProductDetailEdit({
  defaultValues,
  submittedValues,
  parameterValues,
  selectedFile,
  onSelectFile,
  onDescriptionUploadingChange,
}: AdminProductDetailEditProps) {
  const initialExtraInfos = (() => {
    if (submittedValues?.extraInfos) {
      try {
        const parsed = JSON.parse(submittedValues.extraInfos);
        if (parsed && typeof parsed === "object") return parsed as Record<string, string>;
      } catch {
        // fall through to defaultValues
      }
    }
    return (defaultValues?.extraInfos as Record<string, string>) ?? {};
  })();

  const [extraInfos, setExtraInfos] = useState<Record<string, string>>(initialExtraInfos);
  const newExtraInfoKeyRef = useRef<HTMLInputElement>(null);
  const newExtraInfoValueRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const uploadDescriptionImage = useCallback(async (file: File): Promise<string> => {
    const session = await getSession();
    if (!session?.accessToken) throw new Error("로그인이 필요합니다.");

    const response = await postApiS3Upload({ file }, withToken(session.accessToken));
    const key = response.data.key;
    if (!key) throw new Error("업로드된 이미지 키를 확인할 수 없습니다.");

    return buildCloudFrontUrl(key);
  }, []);

  const selectImage = (file: File) => {
    const sizeError = getImageSizeError(file, MAX_BOTTLE_IMAGE_SIZE_MB);
    if (sizeError) {
      setImageError(sizeError);
      return;
    }
    setImageError(null);
    onSelectFile(file);
  };

  const previewUrl = useMemo(() => {
    if (selectedFile) return URL.createObjectURL(selectedFile);
    return defaultValues?.imgUrl;
  }, [selectedFile, defaultValues?.imgUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const currentImage = previewUrl || FALLBACK_IMAGE;
  const visibleDefaultChecked = pickDefaultVisible(submittedValues, defaultValues?.visible);

  const handleRemoveImage = () => {
    onSelectFile(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      selectImage(file);
    }
  };

  const handleAddExtraInfo = () => {
    const key = newExtraInfoKeyRef.current?.value.trim() ?? "";
    const value = newExtraInfoValueRef.current?.value.trim() ?? "";
    if (key && value) {
      setExtraInfos((prev) => ({ ...prev, [key]: value }));
      newExtraInfoKeyRef.current!.value = "";
      newExtraInfoValueRef.current!.value = "";
    }
  };

  const handleRemoveExtraInfo = (key: string) => {
    setExtraInfos((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <div className="rounded-lg bg-white p-4">
      <input type="hidden" name="extraInfos" value={JSON.stringify(extraInfos)} />

      <div className="flex gap-6 divide-x divide-gray-200">
        {/* 왼쪽: 모든 필드 (설명 제외) */}
        <div className="flex-1 space-y-2 pr-6">
          <div className="flex items-center gap-3">
            <Label required className="typo-medium-14 flex w-32 items-center gap-1 text-gray-700">
              제품명
            </Label>
            <input
              type="text"
              name="name"
              maxLength={200}
              required
              defaultValue={pickDefault(submittedValues, "name", defaultValues?.name)}
              className="typo-medium-14 flex-1 rounded border border-gray-300 px-2 py-1"
            />
          </div>

          <div className="flex items-center gap-3">
            <Label required className="typo-medium-14 flex w-32 items-center gap-1 text-gray-700">
              브랜드
            </Label>
            <ParameterCombobox
              name="brand"
              maxLength={50}
              required
              defaultValue={pickDefault(submittedValues, "brand", defaultValues?.brand)}
              options={parameterValues?.brands}
            />
          </div>

          <div className="flex items-center gap-3">
            <Label required className="typo-medium-14 flex w-32 items-center gap-1 text-gray-700">
              시리즈
            </Label>
            <ParameterCombobox
              name="series"
              maxLength={50}
              required
              defaultValue={pickDefault(submittedValues, "series", defaultValues?.series)}
              options={parameterValues?.series}
            />
          </div>

          <div className="flex items-center gap-3">
            <Label required className="typo-medium-14 flex w-32 items-center gap-1 text-gray-700">
              회사
            </Label>
            <ParameterCombobox
              name="company"
              maxLength={50}
              required
              defaultValue={pickDefault(submittedValues, "company", defaultValues?.company)}
              options={parameterValues?.companies}
            />
          </div>

          <div className="flex items-center gap-3">
            <Label required className="typo-medium-14 flex w-32 items-center gap-1 text-gray-700">
              증류소
            </Label>
            <ParameterCombobox
              name="distillery"
              maxLength={50}
              required
              defaultValue={pickDefault(submittedValues, "distillery", defaultValues?.distillery)}
              options={parameterValues?.distilleries}
            />
          </div>

          <div className="flex items-center gap-3">
            <Label required className="typo-medium-14 flex w-32 items-center gap-1 text-gray-700">
              몰트 타입
            </Label>
            <ParameterCombobox
              name="maltType"
              maxLength={50}
              required
              defaultValue={pickDefault(submittedValues, "maltType", defaultValues?.maltType)}
              options={parameterValues?.maltTypes}
            />
          </div>

          <div className="flex items-center gap-3">
            <Label className="typo-medium-14 w-32 text-gray-700">캐스크 타입</Label>
            <ParameterCombobox
              name="caskType"
              maxLength={50}
              defaultValue={pickDefault(submittedValues, "caskType", defaultValues?.caskType)}
              options={parameterValues?.caskTypes}
            />
          </div>

          <div className="flex items-center gap-3">
            <Label className="typo-medium-14 w-32 text-gray-700">캐스크 번호</Label>
            <input
              type="text"
              name="caskNumber"
              maxLength={50}
              defaultValue={pickDefault(submittedValues, "caskNumber", defaultValues?.caskNumber)}
              className="typo-medium-14 flex-1 rounded border border-gray-300 px-2 py-1"
            />
          </div>

          <div className="flex items-center gap-3">
            <Label required className="typo-medium-14 flex w-32 items-center gap-1 text-gray-700">
              알코올 도수 (%)
            </Label>
            <input
              type="number"
              name="abv"
              step="0.1"
              required
              defaultValue={pickDefault(submittedValues, "abv", defaultValues?.abv)}
              className="typo-medium-14 flex-1 rounded border border-gray-300 px-2 py-1"
            />
          </div>

          <div className="flex items-center gap-3">
            <Label required className="typo-medium-14 flex w-32 items-center gap-1 text-gray-700">
              용량 (ml)
            </Label>
            <input
              type="number"
              name="capacity"
              required
              defaultValue={pickDefault(submittedValues, "capacity", defaultValues?.capacity)}
              className="typo-medium-14 flex-1 rounded border border-gray-300 px-2 py-1"
            />
          </div>

          <div className="flex items-center gap-3">
            <Label className="typo-medium-14 w-32 text-gray-700">증류 날짜</Label>
            <div className="relative flex-1">
              <input
                type="date"
                name="distillationDate"
                defaultValue={pickDefault(submittedValues, "distillationDate", defaultValues?.distillationDate)}
                className="typo-medium-14 w-full rounded border border-gray-300 py-1 pr-2 pl-8"
              />
              <CalendarDays
                className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-gray-400"
                size={14}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Label className="typo-medium-14 w-32 text-gray-700">병입 날짜</Label>
            <div className="relative flex-1">
              <input
                type="date"
                name="bottledDate"
                defaultValue={pickDefault(submittedValues, "bottledDate", defaultValues?.bottledDate)}
                className="typo-medium-14 w-full rounded border border-gray-300 py-1 pr-2 pl-8"
              />
              <CalendarDays
                className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-gray-400"
                size={14}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Label className="typo-medium-14 w-32 text-gray-700">재고 수량</Label>
            <input
              type="number"
              name="stockQuantity"
              defaultValue={pickDefault(submittedValues, "stockQuantity", defaultValues?.stockQuantity)}
              className="typo-medium-14 flex-1 rounded border border-gray-300 px-2 py-1"
            />
          </div>

          <div className="flex items-center gap-3">
            <Label className="typo-medium-14 w-32 text-gray-700">공급가</Label>
            <CurrencyInput
              name="supplyPrice"
              defaultValue={pickDefault(submittedValues, "supplyPrice", defaultValues?.supplyPrice)}
              className="typo-medium-14 w-full rounded border border-gray-300 px-2 py-1"
            />
          </div>

          <div className="flex items-center gap-3">
            <Label className="typo-medium-14 w-32 text-gray-700">소비자가</Label>
            <CurrencyInput
              name="consumerPrice"
              defaultValue={pickDefault(submittedValues, "consumerPrice", defaultValues?.consumerPrice)}
              className="typo-medium-14 w-full rounded border border-gray-300 px-2 py-1"
            />
          </div>

          <div className="flex items-center gap-3 rounded border border-gray-200 bg-gray-50 px-3 py-2">
            <span className="typo-medium-14 w-32 text-gray-700">노출 설정</span>
            <label className="typo-medium-14 flex cursor-pointer items-center gap-2 text-gray-900">
              <input
                type="checkbox"
                name="visible"
                value="on"
                defaultChecked={visibleDefaultChecked}
                className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              아카이브 노출
            </label>
          </div>

          {/* 추가 정보 */}
          <div className="border-t pt-2">
            <Label className="typo-bold-14 mb-2 block text-gray-700">추가 정보</Label>
            <div className="space-y-2">
              {Object.entries(extraInfos).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => {
                      setExtraInfos((prev) => {
                        const next = { ...prev };
                        const oldValue = next[key];
                        delete next[key];
                        next[e.target.value] = oldValue;
                        return next;
                      });
                    }}
                    className="typo-medium-14 w-32 rounded border border-gray-300 px-2 py-1"
                    placeholder="키"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                      setExtraInfos((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }));
                    }}
                    className="typo-medium-14 flex-1 rounded border border-gray-300 px-2 py-1"
                    placeholder="값"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveExtraInfo(key)}
                    className="cursor-pointer px-2 py-1 text-red-600 hover:text-red-700"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}

              {/* 새 추가 정보 입력 */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  ref={newExtraInfoKeyRef}
                  className="typo-medium-14 w-32 rounded border border-gray-300 px-2 py-1"
                  placeholder="새 키"
                />
                <input
                  type="text"
                  ref={newExtraInfoValueRef}
                  className="typo-medium-14 flex-1 rounded border border-gray-300 px-2 py-1"
                  placeholder="새 값"
                />
                <button
                  type="button"
                  onClick={handleAddExtraInfo}
                  className="cursor-pointer rounded bg-amber-600 px-2 py-1 text-white transition-colors hover:bg-amber-700"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 중간: 설명 */}
        <div className="flex-1 px-6">
          <div className="typo-medium-14 mb-1 text-gray-600">설명</div>
          <RichTextImageEditor
            name="description"
            defaultValue={String(pickDefault(submittedValues, "description", defaultValues?.description) ?? "")}
            placeholder="설명을 입력하세요. 이미지를 붙여넣거나 추가할 수 있습니다."
            variant="admin"
            uploadFn={uploadDescriptionImage}
            onUploadingChange={onDescriptionUploadingChange}
          />
        </div>

        {/* 오른쪽: 이미지 */}
        <div className="flex flex-1 flex-col pl-6">
          {/* 큰 이미지 / 드롭존 */}
          <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`group relative mb-4 rounded border-2 border-dashed transition-colors ${
              isDragging ? "border-amber-600 bg-amber-50" : "border-transparent"
            }`}
          >
            <Image
              src={currentImage}
              width={320}
              height={576}
              alt={defaultValues?.name ?? ""}
              className="h-[36rem] w-full rounded border border-gray-200 object-contain"
              unoptimized={currentImage.startsWith("blob:")}
            />
            {isDragging ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded bg-amber-100/80">
                <div className="typo-bold-14 flex items-center gap-2 rounded bg-white px-4 py-2 text-amber-700 shadow">
                  <Upload size={18} />
                  여기에 이미지를 놓으세요
                </div>
              </div>
            ) : (
              <div className="bg-opacity-50 absolute inset-0 flex items-center justify-center rounded bg-black opacity-0 transition-opacity group-hover:opacity-100">
                <Label className="typo-bold-14 flex cursor-pointer items-center gap-2 rounded bg-white px-4 py-2 text-gray-900 transition-colors hover:bg-gray-100">
                  <Upload size={18} />
                  이미지 추가 또는 드래그 앤 드롭
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        selectImage(file);
                      }
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </Label>
              </div>
            )}
          </div>
          {/* 썸네일 리스트 */}
          {previewUrl && (
            <div className="flex flex-wrap gap-2">
              <div className="group/thumb relative">
                <Image
                  src={previewUrl}
                  width={64}
                  height={64}
                  alt="Product thumbnail"
                  unoptimized={previewUrl.startsWith("blob:")}
                  className="h-16 w-16 rounded border-2 border-amber-600 object-cover ring-2 ring-amber-300"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-1 -right-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition-opacity group-hover/thumb:opacity-100"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          )}
          <p className="typo-medium-12 mt-2 text-gray-500">이미지 파일 · 최대 {MAX_BOTTLE_IMAGE_SIZE_MB}MB</p>
          {imageError ? (
            <p role="alert" className="typo-medium-12 mt-1 text-red-600">
              {imageError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
