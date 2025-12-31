'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardOrder, OrderStatus } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Bell, Clock, DollarSign, Package, CheckCircle, XCircle } from 'lucide-react'
import OrderDetailModal from '@/components/orders/OrderDetailModal'
import OrderKanbanCard from '@/components/orders/OrderKanbanCard'
import { getCurrentBusinessman } from '@/lib/actions/users'
import { getOrders, updateOrderStatus } from '@/lib/actions/orders'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import useSound from 'use-sound'

const STATUS_TABS: { label: string; value: OrderStatus | 'all' }[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Pendientes', value: 'pendiente' },
    { label: 'Preparando', value: 'preparando' },
    { label: 'Listos', value: 'en_camino' },
    { label: 'Entregados', value: 'entregado' },
    { label: 'Cancelados', value: 'cancelado' },
]

const STATUS_COLORS: Record<OrderStatus, string> = {
    pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    confirmado: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    preparando: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    listo: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    en_camino: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    entregado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cancelado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export default function OrdersPage() {
    const router = useRouter()
    const [orders, setOrders] = useState<DashboardOrder[]>([])
    // filteredOrders and selectedTab removed as Kanban uses columns directly derived from 'orders'
    const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(null)

    const [loading, setLoading] = useState(true)
    const [businessId, setBusinessId] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        initializePage()
    }, [])

    const initializePage = async () => {
        try {
            const business = await getCurrentBusinessman()
            if (!business) return

            setBusinessId(business.id)

            // Initial fetch using server action
            const initialOrders = await getOrders(business.id)
            setOrders(initialOrders)

            // Subscribe to real-time updates
            const channel = supabase
                .channel('orders-channel')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'orders',
                        filter: `businessman_id=eq.${business.id}`
                    },
                    (payload) => {
                        const newOrder = payload.new as DashboardOrder
                        refreshOrders(business.id)
                        showNotification(newOrder)
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'orders',
                        filter: `businessman_id=eq.${business.id}`
                    },
                    (payload) => {
                        refreshOrders(business.id)
                    }
                )
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        } catch (error) {
            console.error('Error initializing orders page:', error)
        } finally {
            setLoading(false)
        }
    }

    const refreshOrders = async (bId: string) => {
        const latestOrders = await getOrders(bId)
        setOrders(latestOrders)
        router.refresh()
    }

    const [playNotification] = useSound('/notification.mp3')

    const showNotification = (order: DashboardOrder) => {
        playNotification()

        toast.custom((t) => (
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-4 border-l-4 border-indigo-500 w-full max-w-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors" onClick={() => {
                setSelectedOrder(order)
                toast.dismiss(t)
            }}>
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">¡Nuevo Pedido!</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {order.customer_name}
                        </p>
                        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                            ${order.total.toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-full">
                        <Bell className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                </div>
                <div className="mt-3 flex justify-end">
                    <button
                        className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                    >
                        Ver detalles &rarr;
                    </button>
                </div>
            </div>
        ), {
            duration: 10000,
            position: 'top-right',
        })
    }

    const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus, e?: React.MouseEvent) => {
        e?.stopPropagation()

        // Optimistic update locally could be done here if needed
        const result = await updateOrderStatus(orderId, newStatus)

        if (result.success && businessId) {
            refreshOrders(businessId)
        } else {
            alert('Error updating order status')
        }
    }

    const getElapsedTime = (createdAt: string) => {
        return formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: es })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    }

    const getDishCount = (orders: DashboardOrder[]) => {
        return orders.reduce((acc, order) => {
            return acc + (order.order_items?.reduce((itemAcc, item) => itemAcc + item.quantity, 0) || 0)
        }, 0)
    }

    const columns = [
        {
            id: 'pendiente',
            title: 'Nuevos',
            orders: orders.filter(o => o.status === 'pendiente'),
            color: 'bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700',
            iconColor: 'text-zinc-600 dark:text-zinc-400',
            borderColor: 'border-t-4 border-t-zinc-400'
        },
        {
            id: 'preparacion',
            title: 'Cocina',
            orders: orders.filter(o => ['confirmado', 'confirmed', 'preparando', 'preparing'].includes(o.status)),
            color: 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-900/50',
            iconColor: 'text-purple-600 dark:text-purple-400',
            borderColor: 'border-t-4 border-t-purple-500'
        },
        {
            id: 'listo',
            title: 'Packing',
            orders: orders.filter(o => ['listo', 'ready'].includes(o.status)),
            color: 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/50',
            iconColor: 'text-orange-600 dark:text-orange-400',
            borderColor: 'border-t-4 border-t-orange-500'
        },
        {
            id: 'en_camino',
            title: 'En Ruta',
            orders: orders.filter(o => ['en_camino', 'en_route'].includes(o.status)),
            color: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/50',
            iconColor: 'text-blue-600 dark:text-blue-400',
            borderColor: 'border-t-4 border-t-blue-500'
        },
        {
            id: 'entregado',
            title: 'Entregados',
            orders: orders.filter(o => ['entregado', 'delivered'].includes(o.status)).slice(0, 5), // Keep history short
            color: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/50',
            iconColor: 'text-green-600 dark:text-green-400',
            borderColor: 'border-t-4 border-t-green-500'
        }
    ]

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex items-center justify-between mb-4 px-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tablero de Control</h1>
                <div className="flex items-center gap-4">
                    {/* Summary Stats could go here */}
                </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2">
                <div className="h-full flex gap-3 min-w-[1200px] px-1">
                    {columns.map((col) => {
                        const dishCount = getDishCount(col.orders)

                        return (
                            <div key={col.id} className={`flex-1 min-w-[260px] flex flex-col bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-800 ${col.borderColor}`}>
                                {/* Column Header */}
                                <div className={`p-3 border-b border-gray-100 dark:border-zinc-800 flex flex-col gap-1 bg-gray-50/50 dark:bg-zinc-800/30`}>
                                    <div className="flex items-center justify-between">
                                        <h2 className="font-bold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide">{col.title}</h2>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${col.color} ${col.iconColor}`}>
                                            {col.orders.length}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                                        {dishCount} Pedidos
                                    </div>
                                </div>

                                {/* Column Content */}
                                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar bg-gray-50/30 dark:bg-zinc-900/50">
                                    <AnimatePresence mode="popLayout">
                                        {col.orders.length === 0 ? (
                                            <div className="text-center py-10 opacity-40">
                                                <Package className="mx-auto h-8 w-8 mb-2" />
                                                <span className="text-xs">Sin pedidos</span>
                                            </div>
                                        ) : (
                                            col.orders.map((order) => (
                                                <OrderKanbanCard
                                                    key={order.id}
                                                    order={order}
                                                    onStatusUpdate={handleStatusUpdate}
                                                    onClick={setSelectedOrder}
                                                />
                                            ))
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onUpdate={() => businessId && refreshOrders(businessId)}
                />
            )}
        </div>
    )
}
