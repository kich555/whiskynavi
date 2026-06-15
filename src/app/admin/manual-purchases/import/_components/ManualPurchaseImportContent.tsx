"use client";

import type {
  AdminManualPurchaseImportResponse,
  AdminUserResponse,
  BottleAdminResponse,
} from "@/apis/generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileCheck2, FileSpreadsheet, FileUp, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import AdminHeader from "../../../_components/AdminHeader";
import { useSidebar } from "../../../_components/AdminLayoutClient";
import {
  downloadManualPurchaseImportTemplateAction,
  type ManualPurchaseImportMode,
  uploadManualPurchaseImportAction,
} from "../../actions";
import { downloadBase64File } from "../_lib/downloadBase64File";
import { formatImportFailureToast } from "../_lib/importFailureDetails";
import ImportResultSummary from "./ImportResultSummary";
import { BottleReferenceTable, UserReferenceTable } from "./ReferenceTables";

export interface ManualPurchaseImportSearchParams extends Record<string, string | undefined> {
  userQ?: string;
  userField?: string;
  bottleQ?: string;
}

interface ManualPurchaseImportContentProps {
  searchParams: ManualPurchaseImportSearchParams;
  users: AdminUserResponse[];
  bottles: BottleAdminResponse[];
}

const MODES: { value: ManualPurchaseImportMode; label: string; detail: string }[] = [
  {
    value: "ONE_USER_MANY_BOTTLES",
    label: "한 사용자 여러 보틀",
    detail: "파일 내 사용자 ID는 하나만 허용",
  },
  {
    value: "ONE_BOTTLE_MANY_USERS",
    label: "한 보틀 여러 사용자",
    detail: "파일 내 보틀 ID는 하나만 허용",
  },
  {
    value: "MANY_USERS_MANY_BOTTLES",
    label: "여러 사용자 여러 보틀",
    detail: "사용자와 보틀 조합을 행별 처리",
  },
];

const USER_SEARCH_FIELDS = [
  { value: "name", label: "이름" },
  { value: "username", label: "아이디" },
  { value: "email", label: "이메일" },
  { value: "phone", label: "전화번호" },
];

export default function ManualPurchaseImportContent({
  searchParams,
  users,
  bottles,
}: ManualPurchaseImportContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<ManualPurchaseImportMode>("ONE_USER_MANY_BOTTLES");
  const [result, setResult] = useState<AdminManualPurchaseImportResponse | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDownloadTemplate = () => {
    startTransition(async () => {
      const response = await downloadManualPurchaseImportTemplateAction();
      if (response.success) {
        downloadBase64File(
          "manual-purchase-import-template.xlsx",
          response.data,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
      } else {
        toast.error(response.error);
      }
    });
  };

  const handleUpload = (dryRun: boolean) => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Excel 파일을 선택해주세요.");
      return;
    }

    startTransition(async () => {
      const response = await uploadManualPurchaseImportAction(file, mode, dryRun);
      if (response.success) {
        setResult(response.data);
        const failureCount = response.data.failureCount ?? 0;
        if (failureCount > 0) {
          toast.warning(formatImportFailureToast(response.data));
        } else {
          toast.success(dryRun ? "Excel 검증이 끝났습니다." : "구매내역 등록을 완료했습니다.");
        }
        router.refresh();
      } else {
        toast.error(response.error);
      }
    });
  };

  return (
    <>
      <AdminHeader title="수동 구매내역 대량 등록" onToggleSidebar={toggle} showSearch={false} />

      <div className="space-y-6 p-8">
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="typo-bold-18 text-gray-900">Excel 업로드</h2>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                {["사용자ID", "보틀ID", "수량", "단가", "메모"].map((column) => (
                  <span key={column} className="rounded border border-gray-200 px-2 py-1">
                    {column}
                  </span>
                ))}
              </div>
            </div>
            <Button type="button" variant="outline" onClick={handleDownloadTemplate} disabled={isPending}>
              <Download className="size-4" />
              템플릿 다운로드
            </Button>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {MODES.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setMode(item.value)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  mode === item.value ? "border-amber-500 bg-amber-50" : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <span className="block font-semibold text-gray-900">{item.label}</span>
                <span className="mt-1 block text-sm text-gray-500">{item.detail}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="inline-flex min-h-10 flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm text-gray-700">
              <FileSpreadsheet className="size-4 text-gray-400" />
              <input ref={fileInputRef} type="file" accept=".xlsx" className="w-full text-sm" />
            </label>
            <Button type="button" variant="outline" onClick={() => handleUpload(true)} disabled={isPending}>
              <FileCheck2 className="size-4" />
              검증
            </Button>
            <Button type="button" onClick={() => handleUpload(false)} disabled={isPending}>
              <FileUp className="size-4" />
              실제 등록
            </Button>
          </div>

          {result && <ImportResultSummary result={result} />}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="typo-bold-18 text-gray-900">사용자 ID 참고</h2>
              <Link href="/admin/users" className="text-sm text-amber-700">
                전체 보기
              </Link>
            </div>
            <form className="mb-3 grid gap-2 sm:grid-cols-[120px_1fr_auto]">
              <select
                name="userField"
                defaultValue={searchParams.userField ?? "name"}
                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
              >
                {USER_SEARCH_FIELDS.map((field) => (
                  <option key={field.value} value={field.value}>
                    {field.label}
                  </option>
                ))}
              </select>
              <div className="relative">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
                <Input name="userQ" defaultValue={searchParams.userQ ?? ""} className="pl-9" />
              </div>
              <input type="hidden" name="bottleQ" value={searchParams.bottleQ ?? ""} />
              <Button type="submit" variant="outline">
                검색
              </Button>
            </form>
            <UserReferenceTable users={users} />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="typo-bold-18 text-gray-900">보틀 ID 참고</h2>
              <Link href="/admin/products" className="text-sm text-amber-700">
                전체 보기
              </Link>
            </div>
            <form className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
                <Input name="bottleQ" defaultValue={searchParams.bottleQ ?? ""} className="pl-9" />
              </div>
              <input type="hidden" name="userField" value={searchParams.userField ?? "name"} />
              <input type="hidden" name="userQ" value={searchParams.userQ ?? ""} />
              <Button type="submit" variant="outline">
                검색
              </Button>
            </form>
            <BottleReferenceTable bottles={bottles} />
          </div>
        </section>
      </div>
    </>
  );
}
