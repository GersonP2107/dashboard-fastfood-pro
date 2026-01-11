"use client";

import { TopProduct } from "@/lib/types/dashboard";
import { Package, TrendingUp } from "lucide-react";

interface TopProductsListProps {
    products: TopProduct[];
}

export default function TopProductsList({ products = [] }: TopProductsListProps) {
    if (products.length === 0) {
        return (
            <div className="py-8 text-center text-gray-500 text-sm">
                No hay productos vendidos este mes.
            </div>
        );
    }

    // Find max quantity for progress bar calculation
    const maxQuantity = Math.max(...products.map(p => p.total_quantity));

    return (
        <div className="space-y-4">
            {products.map((product, index) => (
                <div key={product.product_id} className="relative">
                    <div className="flex items-center justify-between mb-1 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-zinc-800 text-xs font-bold text-gray-500">
                                {index + 1}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-xs" title={product.product_name}>
                                {product.product_name}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="block font-bold text-gray-900 dark:text-white">
                                {product.total_quantity} vendidos
                            </span>
                            <span className="text-xs text-gray-500">
                                ${product.total_revenue.toLocaleString()}
                            </span>
                        </div>
                    </div>
                    {/* Progress Bar Background */}
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${(product.total_quantity / maxQuantity) * 100}%` }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );
}
