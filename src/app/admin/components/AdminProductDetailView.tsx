"use client";

import type { BottleAdminResponse } from "@/apis/generated/api";
import { formatCurrency } from "@/lib/formatters";
import Image from "next/image";
import { useState } from "react";

interface AdminProductDetailViewProps {
  productDetails: BottleAdminResponse;
}

export default function AdminProductDetailView({ productDetails }: AdminProductDetailViewProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const imgUrls: string[] = productDetails.imgUrl ? [productDetails.imgUrl] : [];
  const fallbackImage = "/default-bottle-v2.png";
  const currentImage = imgUrls.length > 0 ? imgUrls[selectedImageIndex] : fallbackImage;

  return (
    <div className="rounded-lg bg-white p-4">
      <div className="flex gap-6 divide-x divide-gray-200">
        {/* 왼쪽: 모든 필드 (설명 제외) */}
        <div className="flex-1 space-y-2 pr-6">
          <div className="flex gap-3">
            <span className="w-32 text-sm text-gray-600">제품명</span>
            <span className="flex-1 text-sm text-gray-900">{productDetails.name}</span>
          </div>

          <div className="flex gap-3">
            <span className="w-32 text-sm text-gray-600">브랜드</span>
            <span className="flex-1 text-sm text-gray-900">{productDetails.brand}</span>
          </div>

          {productDetails.series && (
            <div className="flex gap-3">
              <span className="w-32 text-sm text-gray-600">시리즈</span>
              <span className="flex-1 text-sm text-gray-900">{productDetails.series}</span>
            </div>
          )}

          {productDetails.company && (
            <div className="flex gap-3">
              <span className="w-32 text-sm text-gray-600">회사</span>
              <span className="flex-1 text-sm text-gray-900">{productDetails.company}</span>
            </div>
          )}

          {productDetails.distillery && (
            <div className="flex gap-3">
              <span className="w-32 text-sm text-gray-600">증류소</span>
              <span className="flex-1 text-sm text-gray-900">{productDetails.distillery}</span>
            </div>
          )}

          {productDetails.maltType && (
            <div className="flex gap-3">
              <span className="w-32 text-sm text-gray-600">몰트 타입</span>
              <span className="flex-1 text-sm text-gray-900">{productDetails.maltType}</span>
            </div>
          )}

          {productDetails.caskType && (
            <div className="flex gap-3">
              <span className="w-32 text-sm text-gray-600">캐스크 타입</span>
              <span className="flex-1 text-sm text-gray-900">{productDetails.caskType}</span>
            </div>
          )}

          {productDetails.caskNumber && (
            <div className="flex gap-3">
              <span className="w-32 text-sm text-gray-600">캐스크 번호</span>
              <span className="flex-1 text-sm text-gray-900">{productDetails.caskNumber}</span>
            </div>
          )}

          {productDetails.abv && (
            <div className="flex gap-3">
              <span className="w-32 text-sm text-gray-600">알코올 도수</span>
              <span className="flex-1 text-sm text-gray-900">{productDetails.abv}%</span>
            </div>
          )}

          {productDetails.capacity && (
            <div className="flex gap-3">
              <span className="w-32 text-sm text-gray-600">용량</span>
              <span className="flex-1 text-sm text-gray-900">{productDetails.capacity}ml</span>
            </div>
          )}

          {productDetails.distillationDate && (
            <div className="flex gap-3">
              <span className="w-32 text-sm text-gray-600">증류 날짜</span>
              <span className="flex-1 text-sm text-gray-900">{productDetails.distillationDate}</span>
            </div>
          )}

          {productDetails.bottledDate && (
            <div className="flex gap-3">
              <span className="w-32 text-sm text-gray-600">병입 날짜</span>
              <span className="flex-1 text-sm text-gray-900">{productDetails.bottledDate}</span>
            </div>
          )}

          {productDetails.stockQuantity != null && (
            <div className="flex gap-3">
              <span className="w-32 text-sm text-gray-600">재고 수량</span>
              <span className="flex-1 text-sm text-gray-900">{productDetails.stockQuantity}</span>
            </div>
          )}

          {productDetails.supplyPrice != null && (
            <div className="flex gap-3">
              <span className="w-32 text-sm text-gray-600">공급가</span>
              <span className="flex-1 text-sm text-gray-900">{formatCurrency(productDetails.supplyPrice)}</span>
            </div>
          )}

          {productDetails.consumerPrice != null && (
            <div className="flex gap-3">
              <span className="w-32 text-sm text-gray-600">소비자가</span>
              <span className="flex-1 text-sm text-gray-900">{formatCurrency(productDetails.consumerPrice)}</span>
            </div>
          )}

          {/* 추가 정보 */}
          {productDetails.extraInfos && Object.keys(productDetails.extraInfos).length > 0 && (
            <div className="border-t pt-2">
              <div className="typo-bold-14 mb-2 text-gray-600">추가 정보</div>
              {Object.entries(productDetails.extraInfos).map(([key, value]) => (
                <div key={key} className="flex gap-3">
                  <span className="w-32 text-sm text-gray-600">{key}</span>
                  <span className="flex-1 text-sm text-gray-900">{value as string}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 중간: 설명 */}
        <div className="flex-1 px-6">
          <div className="mb-1 text-sm text-gray-600">설명</div>
          <div className="text-sm whitespace-pre-wrap text-gray-900">
            {productDetails.description || "설명이 없습니다."}
          </div>
        </div>

        {/* 오른쪽: 이미지 */}
        <div className="flex flex-1 flex-col pl-6">
          <div className="relative mb-4">
            <Image
              src={currentImage}
              width={320}
              height={320}
              alt={productDetails.name ?? ""}
              className="h-80 w-full rounded border border-gray-200 object-cover"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {imgUrls.map((url, index) => (
              <div key={url} className="relative">
                <Image
                  src={url}
                  width={64}
                  height={64}
                  alt={`Product ${index + 1}`}
                  className={`h-16 w-16 cursor-pointer rounded border-2 object-cover transition-all ${
                    index === selectedImageIndex
                      ? "border-amber-600 ring-2 ring-amber-300"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
