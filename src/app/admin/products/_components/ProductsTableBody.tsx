"use client";

import type { BottleAdminResponse } from "@/apis/generated/api";
import { memo } from "react";

interface ProductsTableBodyProps {
  products: BottleAdminResponse[];
  onProductClick: (productId: number) => void;
}

function ProductsTableBody({ products, onProductClick }: ProductsTableBodyProps) {
  return (
    <tbody className="divide-y divide-gray-100">
      {products.map((product) => (
        <tr key={product.id} className="transition-colors hover:bg-gray-50">
          <td className="px-2 py-1.5 typo-medium-12 whitespace-nowrap text-gray-900">{product.id}</td>
          <td className="typo-medium-12 max-w-[200px] truncate px-2 py-1.5 text-gray-900">{product.name}</td>
          <td className="px-2 py-1.5 typo-medium-12 whitespace-nowrap text-gray-600">{product.brand}</td>
          <td className="px-2 py-1.5 typo-medium-12 whitespace-nowrap text-gray-600">{product.distillery}</td>
          <td className="max-w-[120px] truncate px-2 py-1.5 typo-medium-12 text-gray-600">{product.series || "-"}</td>
          <td className="px-2 py-1.5 typo-medium-12 whitespace-nowrap text-gray-600">{product.caskType}</td>
          <td className="px-2 py-1.5 typo-medium-12 whitespace-nowrap text-gray-600">{product.abv}%</td>
          <td className="px-2 py-1.5 typo-medium-12 whitespace-nowrap text-gray-600">{product.capacity}ml</td>
          <td className="px-2 py-1.5 typo-medium-12 whitespace-nowrap text-gray-600">{product.bottledDate || "-"}</td>
          <td className="px-2 py-1.5 typo-medium-12 whitespace-nowrap">
            <button
              type="button"
              onClick={() => onProductClick(product.id as number)}
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

export default memo(ProductsTableBody);
