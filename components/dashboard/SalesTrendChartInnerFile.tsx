"use client";

import { SalesTrendPoint } from "@/lib/types/dashboard";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export interface SalesTrendChartInnerProps {
    data: SalesTrendPoint[];
}

export default function SalesTrendChartInner({ data }: SalesTrendChartInnerProps) {
    return (
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                        dataKey="date"
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value: number) => `$${value}`}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(234, 88, 12, 0.1)' }}
                        contentStyle={{
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            border: '1px solid #E5E7EB',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: '#111827', fontWeight: 600 }}
                        formatter={(value: number | undefined) => [`$${Number(value ?? 0).toLocaleString()}`, 'Ventas']}
                        labelStyle={{ color: '#6B7280', marginBottom: '4px' }}
                    />
                    <Bar
                        dataKey="sales"
                        fill="#ea580c"
                        radius={[4, 4, 0, 0]}
                        barSize={32}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
