'use client'

import { useState, useEffect } from 'react'
import { getCurrentBusinessman } from '@/lib/actions/users'
import { getFinancialStats, DateRange } from '@/lib/actions/finance'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import { DollarSign, ShoppingBag, CreditCard, TrendingUp, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

// Inline formatter if utility missing
const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount)
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444']

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

    if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>

    if (!stats) return <div className="p-8">No hay datos disponibles.</div>

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <DollarSign className="w-8 h-8 text-green-600 p-1 bg-green-100 rounded-lg dark:bg-green-900/30" />
                        Finanzas
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Resumen de ingresos y rendimiento.</p>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-1 rounded-lg border border-gray-200 dark:border-zinc-800 flex text-sm font-medium">
                    {(['today', 'week', 'month'] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-4 py-2 rounded-md transition-colors ${range === r
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                                }`}
                        >
                            {r === 'today' ? 'Hoy' : r === 'week' ? 'Esta Semana' : 'Este Mes'}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard
                    title="Ventas Totales"
                    value={formatMoney(stats.totalSales)}
                    icon={TrendingUp}
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                />
                <KPICard
                    title="Pedidos Completados"
                    value={stats.orderCount.toString()}
                    icon={ShoppingBag}
                    color="text-blue-600"
                    bg="bg-blue-50"
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
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Tendencia de Ventas</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.salesOverTime}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorSales)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payment Methods Pie Chart */}
                <div className="lg:col-span-1 bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
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
            <div className={`p-3 rounded-lg ${bg} dark:bg-opacity-20`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
        </motion.div>
    )
}
