'use client'

import { useState, useEffect } from 'react'
import { getCurrentBusinessman } from '@/lib/actions/users'
import { getFinancialStats, DateRange } from '@/lib/actions/finance'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import { DollarSign, ShoppingBag, CreditCard, TrendingUp, Calendar, Download, Store, Bike, Utensils } from 'lucide-react'
import { motion } from 'framer-motion'


// Inline formatter if utility missing
const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount)
}

const COLORS = ['#ea580c', '#22c55e', '#f59e0b', '#dc2626']

export default function FinancePage() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [range, setRange] = useState<DateRange>('week')


    useEffect(() => {
        loadStats()
    }, [range])

    const loadStats = async () => {
        setLoading(true)
        try {
            const business = await getCurrentBusinessman()
            if (business) {
                const data = await getFinancialStats(business.id, range)
                setStats(data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleExport = () => {
        if (!stats?.rawOrders) return

        // 1. Definimos los encabezados
        const headers = ['Orden #', 'Fecha', 'Cliente', 'Tipo', 'Estado', 'Total', 'Método Pago']

        // 2. Mapeamos los datos usando ";" como separador
        const rows = stats.rawOrders.map((o: any) => [
            o.order_number,
            new Date(o.created_at).toLocaleDateString(),
            `"${o.customer_name.replace(/"/g, '""')}"`, // Escapar comillas dobles si existen
            o.delivery_type,
            o.status,
            o.total,
            o.payment_method
        ].join(';')) // <--- Cambiado a punto y coma

        // 3. Unimos todo con saltos de línea
        const csvContent = [headers.join(';'), ...rows].join('\n')

        // 4. El truco del almendruco: Agregamos el BOM para UTF-8 (\uFEFF)
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })

        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `reporte_ventas_${range}.csv`
        link.click()
    }

    if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div></div>

    if (!stats) return <div className="p-8">No hay datos disponibles.</div>

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <DollarSign className="w-8 h-8 text-green-600 p-1.5 bg-green-50 rounded-2xl dark:bg-green-900/20" />
                        Finanzas
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Resumen de ingresos y rendimiento</p>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-1 rounded-2xl border border-gray-200 dark:border-zinc-800 flex text-sm font-medium">
                    {(['today', 'week', 'month'] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-4 py-2 rounded-xl transition-all ${range === r
                                ? 'bg-orange-50 text-brand-primary dark:bg-orange-900/30 dark:text-orange-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                                }`}
                        >
                            {r === 'today' ? 'Hoy' : r === 'week' ? 'Esta Semana' : 'Este Mes'}
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl transition-colors font-medium shadow-sm shadow-orange-200 dark:shadow-none"
                >
                    <Download className="w-4 h-4" />
                    Exportar
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard
                    title="Ventas Totales"
                    value={formatMoney(stats.totalSales)}
                    icon={TrendingUp}
                    color="text-brand-primary"
                    bg="bg-orange-50"
                />
                <KPICard
                    title="Pedidos Completados"
                    value={stats.orderCount.toString()}
                    icon={ShoppingBag}
                    color="text-brand-light"
                    bg="bg-orange-50"
                />
                <KPICard
                    title="Ticket Promedio"
                    value={formatMoney(stats.averageTicket)}
                    icon={CreditCard}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Sales Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Tendencia de Ventas</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.salesOverTime}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ea580c" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => `$${val / 1000}k`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [formatMoney(Number(value || 0)), 'Ventas']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#ea580c"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorSales)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payment Methods Pie Chart */}
                <div className="lg:col-span-1 bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Métodos de Pago</h3>
                    <div className="h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.paymentMethodData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.paymentMethodData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => formatMoney(Number(value || 0))} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Legend Overlay */}
                        <div className="mt-4 space-y-2">
                            {stats.paymentMethodData.map((entry: any, index: number) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-gray-600 dark:text-gray-300">{entry.name}</span>
                                    </div>
                                    <span className="font-medium text-gray-900 dark:text-white">{formatMoney(entry.value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sales by Type Chart */}
                <div className="lg:col-span-1 bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Ventas por Tipo</h3>
                    <div className="h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.salesByTypeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.salesByTypeData?.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => formatMoney(Number(value || 0))} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Legend Overlay */}
                        <div className="mt-4 space-y-2">
                            {stats.salesByTypeData?.map((entry: any, index: number) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-gray-600 dark:text-gray-300">{entry.name}</span>
                                    </div>
                                    <span className="font-medium text-gray-900 dark:text-white">{formatMoney(entry.value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Products */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Platos Más Vendidos</h3>
                    <div className="space-y-4">
                        {stats.topProducts?.map((product: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                        index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-zinc-700 dark:text-gray-300' :
                                            index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                'bg-gray-50 text-gray-500 dark:bg-zinc-800 dark:text-gray-500'
                                        }`}>
                                        #{index + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">{product.name}</h4>
                                        <p className="text-xs text-gray-500">{product.quantity} unidades vendidas</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatMoney(product.revenue)}</p>
                                    <div className="w-16 h-1 mt-1 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-brand-primary rounded-full"
                                            style={{ width: `${(product.revenue / (stats.topProducts[0]?.revenue || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!stats.topProducts || stats.topProducts.length === 0) && (
                            <div className="py-8 text-center text-gray-500">
                                No hay datos de productos suficientes en este periodo.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function KPICard({ title, value, icon: Icon, color, bg }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 flex items-start justify-between"
        >
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
            </div>
            <div className={`p-3 rounded-2xl ${bg} dark:bg-opacity-20`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
        </motion.div>
    )
}
