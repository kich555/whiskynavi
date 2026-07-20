"use client";

import { ArrowLeft, Award, Check, Edit2, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import AdminHeader from "../../_components/AdminHeader";
import { useSidebar } from "../../_components/AdminLayoutClient";

interface MembershipBenefit {
  discount: number;
  earlyAccess: number;
  freeShipping: boolean;
  exclusiveProducts: boolean;
  prioritySupport: boolean;
}

interface BrandBenefits {
  member: MembershipBenefit;
}

interface MembershipBenefitsData {
  navi: BrandBenefits;
  tales: BrandBenefits;
}

// TODO: 혜택 API가 준비되면 서버에서 초기 데이터를 props로 전달받도록 변경
const DEFAULT_BENEFITS: MembershipBenefitsData = {
  navi: {
    member: {
      discount: 10,
      earlyAccess: 2,
      freeShipping: true,
      exclusiveProducts: true,
      prioritySupport: true,
    },
  },
  tales: {
    member: {
      discount: 10,
      earlyAccess: 2,
      freeShipping: true,
      exclusiveProducts: true,
      prioritySupport: true,
    },
  },
};

const BOOLEAN_BENEFIT_FIELDS = [
  { key: "freeShipping" as const, label: "무료 배송" },
  { key: "exclusiveProducts" as const, label: "독점 제품 액세스" },
  { key: "prioritySupport" as const, label: "우선 고객 지원" },
];

export default function MembershipBenefitsContent() {
  const { toggle } = useSidebar();
  const router = useRouter();
  const [isEditMode, setIsEditMode] = useState(false);
  const [benefits, setBenefits] = useState<MembershipBenefitsData>(DEFAULT_BENEFITS);
  const [editingBenefits, setEditingBenefits] = useState<MembershipBenefitsData>(DEFAULT_BENEFITS);

  const handleEdit = () => {
    setEditingBenefits(benefits);
    setIsEditMode(true);
  };

  const handleSave = () => {
    setBenefits(editingBenefits);
    setIsEditMode(false);
    // TODO: 서버 액션으로 저장 API 호출
  };

  const handleCancel = () => {
    setEditingBenefits(benefits);
    setIsEditMode(false);
  };

  const brands: Array<{ key: "navi" | "tales"; label: string }> = [
    { key: "navi", label: "NAVI 회원" },
    { key: "tales", label: "TALES 회원" },
  ];

  const currentBenefits = isEditMode ? editingBenefits : benefits;

  const updateBenefit = (brand: "navi" | "tales", field: keyof MembershipBenefit, value: number | boolean) => {
    setEditingBenefits((prev) => ({
      ...prev,
      [brand]: {
        member: {
          ...prev[brand].member,
          [field]: value,
        },
      },
    }));
  };

  return (
    <>
      <AdminHeader title="멤버십 혜택 관리" onToggleSidebar={toggle} showSearch={false} />

      <div className="p-8">
        {/* 상단 네비게이션 */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex cursor-pointer items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">멤버십 관리로 돌아가기</span>
          </button>
          <div className="flex gap-2">
            {isEditMode ? (
              <>
                <Button onClick={handleSave}>
                  <Save size={16} />
                  저장
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X size={16} />
                  취소
                </Button>
              </>
            ) : (
              <Button onClick={handleEdit}>
                <Edit2 size={16} />
                편집
              </Button>
            )}
          </div>
        </div>

        {/* 혜택 카드 그리드 */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {brands.map(({ key, label }) => {
            const brandBenefits = currentBenefits[key].member;

            return (
              <div key={key} className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="typo-bold-24 text-amber-600">{label}</h3>
                  <Award className="text-amber-600" size={32} />
                </div>

                <div className="space-y-3">
                  {isEditMode ? (
                    <>
                      <div>
                        <Label className="typo-medium-12 text-gray-600">할인율 (%)</Label>
                        <Input
                          type="number"
                          value={brandBenefits.discount}
                          onChange={(e) => updateBenefit(key, "discount", Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="typo-medium-12 text-gray-600">조기 접근 (일)</Label>
                        <Input
                          type="number"
                          value={brandBenefits.earlyAccess}
                          onChange={(e) => updateBenefit(key, "earlyAccess", Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      {BOOLEAN_BENEFIT_FIELDS.map(({ key: field, label: fieldLabel }) => (
                        <div key={field} className="flex items-center justify-between py-2">
                          <Label className="typo-medium-14 text-gray-700">{fieldLabel}</Label>
                          <Switch
                            checked={brandBenefits[field]}
                            onCheckedChange={(checked) => updateBenefit(key, field, checked)}
                          />
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between border-b border-gray-100 py-2">
                        <span className="typo-medium-14 text-gray-600">할인율</span>
                        <span className="typo-bold-14 text-gray-900">{brandBenefits.discount}%</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 py-2">
                        <span className="typo-medium-14 text-gray-600">조기 접근</span>
                        <span className="typo-bold-14 text-gray-900">{brandBenefits.earlyAccess}일</span>
                      </div>
                      {BOOLEAN_BENEFIT_FIELDS.map(({ key: field, label: fieldLabel }) => (
                        <div
                          key={field}
                          className={`flex justify-between py-2 ${field !== "prioritySupport" ? "border-b border-gray-100" : ""}`}
                        >
                          <span className="typo-medium-14 text-gray-600">{fieldLabel}</span>
                          {brandBenefits[field] ? (
                            <Check className="text-green-600" size={20} />
                          ) : (
                            <X className="text-gray-400" size={20} />
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
