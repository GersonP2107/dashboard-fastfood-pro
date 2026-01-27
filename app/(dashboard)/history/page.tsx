'use client'

import { useState, useEffect } from 'react'
import { DashboardOrder, OrderStatus } from '@/lib/types'
import { getHistoryOrders } from '@/lib/actions/orders'
import { getCurrentBusinessman } from '@/lib/actions/users'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
    Calendar,
    Search,
    TrendingUp,
    ShoppingCart,
    CreditCard,
    DollarSign,
    Filter,
    Download,
    Eye
} from 'lucide-react'
import OrderDetailModal from '@/components/orders/OrderDetailModal'

export default function HistoryPage() {
    const [orders, setOrders] = useState<DashboardOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(null)
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setHours(0, 0, 0, 0)), // Today start
        end: new Date(new Date().setHours(23, 59, 59, 999)) // Today end
    })
    const [rangeType, setRangeType] = useState('today') // today, yesterday, week, month, custom
    const [statusFilter, setStatusFilter] = useState('all')

    // Stats
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
                start.setDate(1) // 1st of current month
                start.setHours(0, 0, 0, 0)
                end.setHours(23, 59, 59, 999)
                break
            case 'last_month':
                start.setMonth(now.getMonth() - 1)
                start.setDate(1)
                start.setHours(0, 0, 0, 0)

                end.setMonth(now.getMonth())
                end.setDate(0) // Last day of previous month
                end.setHours(23, 59, 59, 999)
                break
            case 'year':
                start.setMonth(0, 1) // Jan 1st
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
            'confirmado': 'bg-orange-50 text-brand-primary dark:bg-orange-900/30 dark:text-orange-400',
            'confirmed': 'bg-orange-50 text-brand-primary dark:bg-orange-900/30 dark:text-orange-400',
            'preparando': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
            'preparing': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
            'listo': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
            'ready': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
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
            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${style}`}>
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
        // Capitalize for others
        return method.charAt(0).toUpperCase() + method.slice(1);
    }

    return (
        <div className="p-6 space-y-6 max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Historial de Pedidos</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Consulta y analiza el rendimiento de tu negocio.</p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-brand-success">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Ventas Totales</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">${stats.totalRevenue.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-brand-primary">
                            <ShoppingCart className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Pedidos</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalOrders}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Periodo:
                    </span>
                    {[
                        { id: 'today', label: 'Hoy' },
                        { id: 'yesterday', label: 'Ayer' },
                        { id: 'week', label: 'Últimos 7 días' },
                        { id: 'month', label: 'Este Mes' },
                        { id: 'last_month', label: 'Mes Pasado' }
                    ].map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => handleQuickFilter(filter.id)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${rangeType === filter.id
                                ? 'bg-orange-50 border-orange-200 text-brand-primary dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-gray-400 dark:hover:bg-zinc-800'
                                }`}
                        >
                            {filter.label}
                        </button>
                    ))}

                    <div className="h-6 w-px bg-gray-200 dark:bg-zinc-700 mx-2"></div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-sm border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 dark:text-white focus:ring-brand-primary focus:border-brand-primary"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="entregado">Entregados</option>
                        <option value="cancelado">Cancelados</option>
                        <option value="pendiente">Pendientes</option>
                    </select>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 dark:bg-zinc-900/50 p-2 rounded-lg w-fit">
                    Mostrando resultados del
                    <span className="font-bold text-gray-700 dark:text-gray-300">{format(dateRange.start, "d MMM yyyy", { locale: es })}</span>
                    al
                    <span className="font-bold text-gray-700 dark:text-gray-300">{format(dateRange.end, "d MMM yyyy", { locale: es })}</span>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-zinc-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-zinc-800">
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
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-2"></div>
                                        Cargando historial...
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 italic">
                                        No se encontraron pedidos en este periodo.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            #{order.order_number}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                            {format(new Date(order.created_at), "d MMM, h:mm a", { locale: es })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white">{order.customer_name}</div>
                                            <div className="text-xs text-gray-500">{order.delivery_type === 'dine_in' ? 'En Mesa' : 'Domicilio'}</div>
                                        </td>
                                        <td className="px-6 py-4 capitalize text-gray-600 dark:text-gray-300">
                                            {formatPaymentMethod(order.payment_method)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(order.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                                            ${order.total.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="p-2 text-brand-primary hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                                                title="Ver detalles"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
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
