"use client";
import { Filter } from "lucide-react";
import Image from "next/image";
import type React from "react";

interface AdminProductTableProps {
  paginatedData: AdminProductTableProduct[];
  brandFilter: string;
  showBrandFilter: boolean;
  setShowBrandFilter: (show: boolean) => void;
  setBrandFilter: (brand: string) => void;
  distilleryFilter: string;
  showDistilleryFilter: boolean;
  setShowDistilleryFilter: (show: boolean) => void;
  setDistilleryFilter: (distillery: string) => void;
  availableDistilleries: string[];
  setCurrentPage: (page: number) => void;
  setSelectedProduct: (id: number) => void;
  setProductDetails: (product: AdminProductTableProduct) => void;
  setIsEditMode: (mode: boolean) => void;
}

interface AdminProductTableProduct {
  id: number;
  imgUrl?: string;
  name: string;
  brand?: string;
  distillery?: string;
  series?: string;
  caskType?: string;
  caskNumber?: string;
  abv?: number;
  capacity?: number;
  distillationDate?: string;
  bottledDate?: string;
}

export const AdminProductTable: React.FC<AdminProductTableProps> = ({
  paginatedData,
  brandFilter,
  showBrandFilter,
  setShowBrandFilter,
  setBrandFilter,
  distilleryFilter,
  showDistilleryFilter,
  setShowDistilleryFilter,
  setDistilleryFilter,
  availableDistilleries,
  setCurrentPage,
  setSelectedProduct,
  setProductDetails,
  setIsEditMode,
}) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase">ID</th>
            <th className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase">이미지</th>
            <th className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase">제품명</th>
            <th className="typo-bold-10 relative px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase">
              <button
                type="button"
                onClick={() => setShowBrandFilter(!showBrandFilter)}
                className="flex cursor-pointer items-center gap-1 hover:text-amber-600"
              >
                브랜드
                <Filter size={12} />
              </button>
              {showBrandFilter && (
                <div className="absolute top-full left-0 z-20 mt-1 w-40 rounded-lg border border-gray-300 bg-white shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setBrandFilter("all");
                      setShowBrandFilter(false);
                      setCurrentPage(1);
                    }}
                    className={`block w-full cursor-pointer px-3 py-2 text-left typo-medium-12 hover:bg-gray-100 ${brandFilter === "all" ? "bg-amber-50 text-amber-700" : ""}`}
                  >
                    전체
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBrandFilter("위스키내비");
                      setShowBrandFilter(false);
                      setCurrentPage(1);
                    }}
                    className={`block w-full cursor-pointer px-3 py-2 text-left typo-medium-12 hover:bg-gray-100 ${brandFilter === "위스키내비" ? "bg-amber-50 text-amber-700" : ""}`}
                  >
                    위스키내비
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBrandFilter("더 위스키테일즈");
                      setShowBrandFilter(false);
                      setCurrentPage(1);
                    }}
                    className={`block w-full cursor-pointer px-3 py-2 text-left typo-medium-12 hover:bg-gray-100 ${brandFilter === "더 위스키테일즈" ? "bg-amber-50 text-amber-700" : ""}`}
                  >
                    더 위스키테일즈
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBrandFilter("트레일 앤 테일");
                      setShowBrandFilter(false);
                      setCurrentPage(1);
                    }}
                    className={`block w-full cursor-pointer px-3 py-2 text-left typo-medium-12 hover:bg-gray-100 ${brandFilter === "트레일 앤 테일" ? "bg-amber-50 text-amber-700" : ""}`}
                  >
                    트레일 앤 테일
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBrandFilter("투게더 인 스피릿");
                      setShowBrandFilter(false);
                      setCurrentPage(1);
                    }}
                    className={`block w-full cursor-pointer px-3 py-2 text-left typo-medium-12 hover:bg-gray-100 ${brandFilter === "투게더 인 스피릿" ? "bg-amber-50 text-amber-700" : ""}`}
                  >
                    투게더 인 스피릿
                  </button>
                </div>
              )}
            </th>
            <th className="typo-bold-10 relative px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase">
              <button
                type="button"
                onClick={() => setShowDistilleryFilter(!showDistilleryFilter)}
                className="flex cursor-pointer items-center gap-1 hover:text-amber-600"
              >
                증류소
                <Filter size={12} />
              </button>
              {showDistilleryFilter && (
                <div className="absolute top-full left-0 z-20 mt-1 max-h-60 w-40 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setDistilleryFilter("all");
                      setShowDistilleryFilter(false);
                      setCurrentPage(1);
                    }}
                    className={`block w-full cursor-pointer px-3 py-2 text-left typo-medium-12 hover:bg-gray-100 ${distilleryFilter === "all" ? "bg-amber-50 text-amber-700" : ""}`}
                  >
                    전체
                  </button>
                  {availableDistilleries.map((distillery) => (
                    <button
                      type="button"
                      key={distillery}
                      onClick={() => {
                        setDistilleryFilter(distillery);
                        setShowDistilleryFilter(false);
                        setCurrentPage(1);
                      }}
                      className={`block w-full cursor-pointer px-3 py-2 text-left typo-medium-12 hover:bg-gray-100 ${distilleryFilter === distillery ? "bg-amber-50 text-amber-700" : ""}`}
                    >
                      {distillery}
                    </button>
                  ))}
                </div>
              )}
            </th>
            <th className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase">시리즈</th>
            <th className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase">캐스크타입</th>
            <th className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase">캐스크번호</th>
            <th className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase">도수</th>
            <th className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase">용량</th>
            <th className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase">증류일</th>
            <th className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase">병입일</th>
            <th className="typo-bold-10 px-2 py-2 text-left whitespace-nowrap text-gray-700 uppercase">관리</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {paginatedData.map((product) => (
            <tr key={product.id} className="transition-colors hover:bg-gray-50">
              <td className="typo-medium-12 px-2 py-1.5 whitespace-nowrap text-gray-900">{product.id}</td>
              <td className="px-2 py-1.5 whitespace-nowrap">
                <Image
                  src={product.imgUrl || "/default-bottle-v2.png"}
                  alt={product.name}
                  className="h-10 w-10 rounded object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/default-bottle-v2.png";
                  }}
                />
              </td>
              <td className="typo-medium-12 max-w-[200px] truncate px-2 py-1.5 text-gray-900">{product.name}</td>
              <td className="typo-medium-12 px-2 py-1.5 whitespace-nowrap text-gray-600">{product.brand}</td>
              <td className="typo-medium-12 px-2 py-1.5 whitespace-nowrap text-gray-600">{product.distillery}</td>
              <td className="typo-medium-12 max-w-[120px] truncate px-2 py-1.5 text-gray-600">{product.series || "-"}</td>
              <td className="typo-medium-12 px-2 py-1.5 whitespace-nowrap text-gray-600">{product.caskType}</td>
              <td className="typo-medium-12 px-2 py-1.5 whitespace-nowrap text-gray-600">{product.caskNumber}</td>
              <td className="typo-medium-12 px-2 py-1.5 whitespace-nowrap text-gray-600">{product.abv}%</td>
              <td className="typo-medium-12 px-2 py-1.5 whitespace-nowrap text-gray-600">{product.capacity}ml</td>
              <td className="typo-medium-12 px-2 py-1.5 whitespace-nowrap text-gray-600">
                {product.distillationDate
                  ? new Date(product.distillationDate)
                      .toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })
                      .replace(/\. /g, ".")
                      .replace(/\.$/, "")
                  : "-"}
              </td>
              <td className="typo-medium-12 px-2 py-1.5 whitespace-nowrap text-gray-600">
                {product.bottledDate
                  ? new Date(product.bottledDate)
                      .toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })
                      .replace(/\. /g, ".")
                      .replace(/\.$/, "")
                  : "-"}
              </td>
              <td className="typo-medium-12 px-2 py-1.5 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(product.id);
                    setProductDetails(product);
                    setIsEditMode(false);
                  }}
                  className="typo-medium-12 cursor-pointer text-amber-600 hover:text-amber-700"
                >
                  상세
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
