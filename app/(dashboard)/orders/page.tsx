'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardOrder, OrderStatus } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Bell, Clock, DollarSign, Package, CheckCircle, XCircle } from 'lucide-react'
import OrderDetailModal from '@/components/orders/OrderDetailModal'
import { getCurrentBusinessman } from '@/lib/actions/users'
import { getOrders, updateOrderStatus } from '@/lib/actions/orders'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

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
    en_camino: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    entregado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cancelado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export default function OrdersPage() {
    const router = useRouter()
    const [orders, setOrders] = useState<DashboardOrder[]>([])
    const [filteredOrders, setFilteredOrders] = useState<DashboardOrder[]>([])
    const [selectedTab, setSelectedTab] = useState<OrderStatus | 'all'>('all')
    const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(null)
    const [loading, setLoading] = useState(true)
    const [businessId, setBusinessId] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        initializePage()
    }, [])

    useEffect(() => {
        filterOrders()
    }, [selectedTab, orders])

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
                        // Refresh full list to get relations properly, or just append if structure matches
                        // For simplicity/correctness with relations, we'll re-fetch or construct carefully.
                        // Ideally we re-fetch to get order_items.
                        refreshOrders(business.id)
                        playNotificationSound()
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
        router.refresh() // Sync server components if any
    }

    const playNotificationSound = () => {
        const audio = new Audio('/notification.mp3')
        audio.play().catch((e) => console.log('Audio play failed:', e))
    }

    const showNotification = (order: DashboardOrder) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Nuevo Pedido', {
                body: `Pedido #${order.order_number} de ${order.client_name}`,
                icon: '/logo.png', // Ensure this exists or use a valid path
            })
        }
    }

    const filterOrders = () => {
        if (selectedTab === 'all') {
            setFilteredOrders(orders)
        } else {
            setFilteredOrders(orders.filter((order) => order.status === selectedTab))
        }
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

    return (
        <motion.div
            className="space-y-6"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pedidos</h1>
                <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {orders.filter((o) => o.status === 'pendiente').length} pendientes
                    </span>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setSelectedTab(tab.value)}
                            className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${selectedTab === tab.value
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }
              `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Orders Grid */}
            <motion.div
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                variants={containerVariants}
            >
                <AnimatePresence mode="popLayout">
                    {filteredOrders.map((order) => (
                        <motion.div
                            layout
                            key={order.id}
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={() => setSelectedOrder(order)}
                            className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-all"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                    #{order.order_number}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                                    {order.status}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <Package className="h-4 w-4" />
                                    <span>{order.client_name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <DollarSign className="h-4 w-4" />
                                    <span className="font-semibold">${order.total.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <Clock className="h-4 w-4" />
                                    <span>{getElapsedTime(order.created_at)}</span>
                                </div>
                            </div>

                            {order.status === 'pendiente' && (
                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={(e) => handleStatusUpdate(order.id, 'confirmado', e)}
                                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 shadow-sm transition-colors"
                                    >
                                        <CheckCircle className="h-4 w-4 inline mr-1" />
                                        Aceptar
                                    </button>
                                    <button
                                        onClick={(e) => handleStatusUpdate(order.id, 'cancelado', e)}
                                        className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-700 shadow-sm transition-colors"
                                    >
                                        <XCircle className="h-4 w-4 inline mr-1" />
                                        Rechazar
                                    </button>
                                </div>
                            )}

                            {/* Example of moving flow: Confirmed -> Preparing */}
                            {order.status === 'confirmado' && (
                                <div className="mt-4">
                                    <button
                                        onClick={(e) => handleStatusUpdate(order.id, 'preparando', e)}
                                        className="w-full bg-purple-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-purple-700 shadow-sm transition-colors"
                                    >
                                        Empezar a Preparar
                                    </button>
                                </div>
                            )}

                            {order.status === 'preparando' && (
                                <div className="mt-4">
                                    <button
                                        onClick={(e) => handleStatusUpdate(order.id, 'en_camino', e)}
                                        className="w-full bg-indigo-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors"
                                    >
                                        Marcar Listo/En Camino
                                    </button>
                                </div>
                            )}

                            {order.status === 'en_camino' && (
                                <div className="mt-4">
                                    <button
                                        onClick={(e) => handleStatusUpdate(order.id, 'entregado', e)}
                                        className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors"
                                    >
                                        Finalizar Entrega
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay pedidos</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        No se encontraron pedidos para este filtro.
                    </p>
                </div>
            )}

            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onUpdate={() => businessId && refreshOrders(businessId)}
                />
            )}
        </motion.div>
    )
}
