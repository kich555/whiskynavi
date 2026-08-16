"use client";

import type { AdminBottleSeriesResponse } from "@/apis/generated/api";
import { memo } from "react";

interface ProductsTableBodyProps {
  series: AdminBottleSeriesResponse[];
  onSeriesClick: (productId: number) => void;
}

function SeriesTableBody({ series, onSeriesClick }: ProductsTableBodyProps) {
  return (
    <tbody className="divide-y divide-gray-100">
      {series.map((product) => (
        <tr key={product.id} className="transition-colors hover:bg-gray-50">
          <td className="typo-medium-12 px-2 py-1.5 whitespace-nowrap text-gray-900">{product.id}</td>
          <td className="typo-medium-12 max-w-[200px] truncate px-2 py-1.5 text-gray-900">{product.series}</td>
          <td className="typo-medium-12 px-2 py-1.5 whitespace-nowrap text-gray-600">{product.brand}</td>
          <td className="typo-medium-12 px-2 py-1.5 whitespace-nowrap text-gray-600">{product.createdAt}</td>
          <td className="typo-medium-12 px-2 py-1.5 whitespace-nowrap text-gray-600">{product.updatedAt}</td>
          <td className="typo-medium-12 px-2 py-1.5 whitespace-nowrap text-gray-600">
            {product.visible ? "공개" : "비공개"}
          </td>
          <td className="typo-medium-12 px-2 py-1.5 whitespace-nowrap">
            <button
              type="button"
              onClick={() => onSeriesClick(product.id as number)}
              className="cursor-pointer font-medium text-amber-600 hover:text-amber-700"
            >
              상세
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  );
}

export default memo(SeriesTableBody);
