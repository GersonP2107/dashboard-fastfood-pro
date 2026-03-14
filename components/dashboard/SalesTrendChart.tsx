"use client";

import { SalesTrendPoint } from "@/lib/types/dashboard";
import dynamic from "next/dynamic";
import type { SalesTrendChartInnerProps } from "./SalesTrendChartInnerFile";

const SalesTrendChartInner = dynamic<SalesTrendChartInnerProps>(() => import("./SalesTrendChartInnerFile"), {
    ssr: false,
    loading: () => (
        <div className="h-72 w-full flex items-center justify-center">
            <div className="animate-pulse bg-gray-200 dark:bg-zinc-800 rounded-xl w-full h-full" />
        </div>
    ),
});

interface SalesTrendChartProps {
    data: SalesTrendPoint[];
}

export default function SalesTrendChart({ data }: SalesTrendChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                No hay datos suficientes para mostrar
            </div>
        );
    }

    return <SalesTrendChartInner data={data} />;
}
