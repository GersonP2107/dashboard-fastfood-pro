'use client'

import { useState, useEffect } from 'react'
import { DashboardOrder } from '@/lib/types'
import { getHistoryOrders } from '@/lib/actions/orders'
import { getCurrentBusinessman } from '@/lib/actions/users'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
    Calendar,
    ShoppingCart,
    DollarSign,
    Eye
} from 'lucide-react'
import OrderDetailModal from '@/components/orders/OrderDetailModal'

export default function HistoryPage() {
    const [orders, setOrders] = useState<DashboardOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(null)
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setHours(0, 0, 0, 0)),
        end: new Date(new Date().setHours(23, 59, 59, 999))
    })
    const [rangeType, setRangeType] = useState('today')
    const [statusFilter, setStatusFilter] = useState('all')

    const stats = {
        totalRevenue: orders.reduce((sum, o) => ['entregado', 'delivered'].includes(o.status) ? sum + o.total : sum, 0),
        totalOrders: orders.length,
        completedOrders: orders.filter(o => ['entregado', 'delivered'].includes(o.status)).length,
        averageTicket: 0
    }
    stats.averageTicket = stats.completedOrders > 0 ? stats.totalRevenue / stats.completedOrders : 0

    useEffect(() => {
        fetchHistory()
    }, [dateRange, statusFilter])

    const fetchHistory = async () => {
        setLoading(true)
        try {
            const business = await getCurrentBusinessman()
            if (!business) return

            const result = await getHistoryOrders(business.id, {
                startDate: dateRange.start,
                endDate: dateRange.end,
                status: statusFilter
            })
            setOrders(result)
        } catch (error) {
            console.error("Error fetching history:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleQuickFilter = (type: string) => {
        setRangeType(type)
        const now = new Date()
        const start = new Date()
        const end = new Date()

        switch (type) {
            case 'today':
                start.setHours(0, 0, 0, 0)
                end.setHours(23, 59, 59, 999)
                break
            case 'yesterday':
                start.setDate(now.getDate() - 1)
                start.setHours(0, 0, 0, 0)
                end.setDate(now.getDate() - 1)
                end.setHours(23, 59, 59, 999)
                break
            case 'week':
                start.setDate(now.getDate() - 7)
                start.setHours(0, 0, 0, 0)
                end.setHours(23, 59, 59, 999)
                break
            case 'month':
                start.setDate(1)
                start.setHours(0, 0, 0, 0)
                end.setHours(23, 59, 59, 999)
                break
            case 'last_month':
                start.setMonth(now.getMonth() - 1)
                start.setDate(1)
                start.setHours(0, 0, 0, 0)
                end.setMonth(now.getMonth())
                end.setDate(0)
                end.setHours(23, 59, 59, 999)
                break
            case 'year':
                start.setMonth(0, 1)
                start.setHours(0, 0, 0, 0)
                end.setHours(23, 59, 59, 999)
                break
        }
        setDateRange({ start, end })
    }

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'entregado': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            'delivered': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            'cancelado': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            'pendiente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            'confirmado': 'bg-brand-primary/8 text-brand-primary dark:bg-brand-primary/25 dark:text-brand-light',
            'confirmed': 'bg-brand-primary/8 text-brand-primary dark:bg-brand-primary/25 dark:text-brand-light',
            'preparando': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
            'preparing': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
            'listo': 'bg-brand-primary/12 text-brand-accent dark:bg-brand-primary/25 dark:text-brand-light',
            'ready': 'bg-brand-primary/12 text-brand-accent dark:bg-brand-primary/25 dark:text-brand-light',
            'en_camino': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            'en_route': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            'on_way': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        }

        const labels: Record<string, string> = {
            'entregado': 'Entregado',
            'delivered': 'Entregado',
            'cancelado': 'Cancelado',
            'cancelled': 'Cancelado',
            'pendiente': 'Pendiente',
            'pending': 'Pendiente',
            'confirmado': 'Confirmado',
            'confirmed': 'Confirmado',
            'preparando': 'Preparando',
            'preparing': 'Preparando',
            'listo': 'Listo',
            'ready': 'Listo',
            'en_camino': 'En Ruta',
            'en_route': 'En Ruta',
            'on_way': 'En Ruta'
        }

        const style = styles[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'

        return (
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase shrink-0 ${style}`}>
                {labels[status] || status}
            </span>
        )
    }

    const formatPaymentMethod = (method: string) => {
        const m = method?.toLowerCase() || ''
        if (['transfer', 'transferencia', 'nequi', 'daviplata', 'bancolombia'].some(t => m.includes(t))) {
            return 'Transferencia'
        }
        if (m.includes('efectivo') || m.includes('cash')) {
            return 'Efectivo'
        }
        return method.charAt(0).toUpperCase() + method.slice(1);
    }

    return (
        <div className="p-3 sm:p-6 space-y-4 md:space-y-6 max-h-screen overflow-y-auto custom-scrollbar max-w-full overflow-x-hidden">

            {/* Header y Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="shrink-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">Historial de Pedidos</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Consulta y analiza tu negocio.</p>
                </div>

                <div className="grid grid-cols-2 md:flex gap-2 sm:gap-4 w-full md:w-auto">
                    <div className="bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="p-1.5 sm:p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 shrink-0">
                            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-gray-500 uppercase font-bold truncate">Ventas</p>
                            <p className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white truncate">${stats.totalRevenue.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="p-1.5 sm:p-2 bg-brand-primary/8 dark:bg-brand-primary/15 rounded-lg text-brand-primary shrink-0">
                            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-gray-500 uppercase font-bold truncate">Pedidos</p>
                            <p className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white truncate">{stats.totalOrders}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 space-y-4 max-w-full">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 shrink-0 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> Periodo:
                        </span>
                        {[
                            { id: 'today', label: 'Hoy' },
                            { id: 'yesterday', label: 'Ayer' },
                            { id: 'week', label: '7 días' },
                            { id: 'month', label: 'Este Mes' },
                            { id: 'last_month', label: 'Mes Pasado' },
                            { id: 'custom', label: 'Personalizado' }
                        ].map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => handleQuickFilter(filter.id)}
                                className={`px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-colors border shrink-0 ${rangeType === filter.id
                                    ? 'bg-brand-primary/8 border-brand-primary/20 text-brand-primary dark:bg-brand-primary/25'
                                    : 'bg-white border-gray-200 text-gray-600 dark:bg-zinc-900 dark:border-zinc-700'
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    {rangeType === 'custom' && (
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-zinc-800/30 rounded-lg border border-gray-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-200">
                            <input
                                type="date"
                                value={format(dateRange.start, 'yyyy-MM-dd')}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        const date = new Date(e.target.value + 'T00:00:00');
                                        setDateRange(prev => ({ ...prev, start: date }));
                                    }
                                }}
                                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                value={format(dateRange.end, 'yyyy-MM-dd')}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        const date = new Date(e.target.value + 'T23:59:59');
                                        setDateRange(prev => ({ ...prev, end: date }));
                                    }
                                }}
                                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                            />
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full sm:w-auto text-xs border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/50 dark:text-white py-2"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="entregado">Entregados</option>
                            <option value="cancelado">Cancelados</option>
                            <option value="pendiente">Pendientes</option>
                            <option value="preparing">Preparando</option>
                        </select>

                        <div className="flex items-center justify-between gap-2 text-[10px] text-gray-400 bg-gray-50 dark:bg-zinc-800/50 p-2 rounded-lg sm:w-auto">
                            <span className="font-bold text-gray-700 dark:text-gray-300">{format(dateRange.start, "d MMM", { locale: es })}</span>
                            <span>al</span>
                            <span className="font-bold text-gray-700 dark:text-gray-300">{format(dateRange.end, "d MMM", { locale: es })}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-3 sm:hidden">
                {loading ? (
                    <div className="py-12 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                        Cargando...
                    </div>
                ) : orders.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 italic bg-white dark:bg-zinc-900 rounded-xl border border-gray-200">
                        Sin pedidos en este periodo.
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className="bg-white dark:bg-zinc-900 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col gap-3">
                            <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900 dark:text-white text-sm">#{order.order_number}</span>
                                        <span className="text-[10px] text-gray-400 shrink-0">
                                            {format(new Date(order.created_at), "h:mm a")}
                                        </span>
                                    </div>
                                    <h3 className="text-gray-900 dark:text-white font-medium text-xs truncate mt-0.5">
                                        {order.customer_name}
                                    </h3>
                                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                                        {order.delivery_type === 'dine_in' ? 'Mesa' : 'Domicilio'} • {formatPaymentMethod(order.payment_method)}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                                        ${order.total.toLocaleString()}
                                    </span>
                                    {getStatusBadge(order.status)}
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedOrder(order)}
                                className="w-full py-2 bg-gray-50 dark:bg-zinc-800 text-brand-primary font-bold rounded-lg text-[11px] flex items-center justify-center gap-2 transition-colors active:bg-gray-100"
                            >
                                <Eye className="w-3.5 h-3.5" />
                                Ver Detalles
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-zinc-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4"># Pedido</th>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Método Pago</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Total</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">#{order.order_number}</td>
                                    <td className="px-6 py-4 text-gray-500">{format(new Date(order.created_at), "d MMM, h:mm a", { locale: es })}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900 dark:text-white">{order.customer_name}</div>
                                        <div className="text-xs text-gray-500">{order.delivery_type === 'dine_in' ? 'En Mesa' : 'Domicilio'}</div>
                                    </td>
                                    <td className="px-6 py-4">{formatPaymentMethod(order.payment_method)}</td>
                                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                                    <td className="px-6 py-4 text-right font-bold">${order.total.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => setSelectedOrder(order)} className="p-2 text-brand-primary hover:bg-brand-primary/8 rounded-lg transition-colors">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onUpdate={() => fetchHistory()}
                />
            )}
        </div>
    )
}