'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardOrder, OrderStatus } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Bell, Clock, DollarSign, Package, CheckCircle, XCircle } from 'lucide-react'
import OrderDetailModal from '@/components/orders/OrderDetailModal'

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
    const [orders, setOrders] = useState<DashboardOrder[]>([])
    const [filteredOrders, setFilteredOrders] = useState<DashboardOrder[]>([])
    const [selectedTab, setSelectedTab] = useState<OrderStatus | 'all'>('all')
    const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchOrders()
        subscribeToOrders()
    }, [])

    useEffect(() => {
        filterOrders()
    }, [selectedTab, orders])

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          order_items (
            *,
            order_item_modifiers (*)
          )
        `)
                .order('created_at', { ascending: false })
                .limit(100)

            if (error) throw error
            setOrders(data || [])
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setLoading(false)
        }
    }

    const subscribeToOrders = () => {
        const channel = supabase
            .channel('orders-channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                },
                (payload) => {
                    const newOrder = payload.new as DashboardOrder
                    setOrders((prev) => [newOrder, ...prev])
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
                },
                (payload) => {
                    const updatedOrder = payload.new as DashboardOrder
                    setOrders((prev) =>
                        prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
                    )
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }

    const playNotificationSound = () => {
        const audio = new Audio('/notification.mp3')
        audio.play().catch((e) => console.log('Audio play failed:', e))
    }

    const showNotification = (order: DashboardOrder) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Nuevo Pedido', {
                body: `Pedido #${order.order_number} de ${order.client_name}`,
                icon: '/logo.png',
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

    return (
        <div className="space-y-6">
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
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredOrders.map((order) => (
                    <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
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
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        // Handle accept
                                    }}
                                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700"
                                >
                                    <CheckCircle className="h-4 w-4 inline mr-1" />
                                    Aceptar
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        // Handle reject
                                    }}
                                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-700"
                                >
                                    <XCircle className="h-4 w-4 inline mr-1" />
                                    Rechazar
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

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
                    onUpdate={fetchOrders}
                />
            )}
        </div>
    )
}
