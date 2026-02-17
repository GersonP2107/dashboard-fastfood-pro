'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardOrder, OrderStatus } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Bell, Clock, Package, Wifi, WifiOff, RefreshCw, Volume2, Eraser, Filter } from 'lucide-react'
import OrderDetailModal from '@/components/orders/OrderDetailModal'
import OrderKanbanCard from '@/components/orders/OrderKanbanCard'
import { getCurrentBusinessman } from '@/lib/actions/users'
import { getOrders, updateOrderStatus } from '@/lib/actions/orders'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    MouseSensor,
    TouchSensor,
    DragStartEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

// --- Draggable Card Wrapper ---
function DraggableOrderCard({ order, onStatusUpdate, onClick }: {
    order: DashboardOrder,
    onStatusUpdate: (id: string, status: OrderStatus, e?: React.MouseEvent) => void,
    onClick: (order: DashboardOrder) => void
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: order.id,
        data: { order }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none', // Important for touch devices
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none">
            <OrderKanbanCard
                order={order}
                onStatusUpdate={onStatusUpdate}
                onClick={onClick}
            />
        </div>
    );
}

// --- Droppable Column Wrapper ---
function KanbanColumn({ col, dishCount, children }: { col: any, dishCount: number, children: React.ReactNode }) {
    const { setNodeRef } = useDroppable({
        id: col.id,
    });

    return (
        <div ref={setNodeRef} className={`flex-1 min-w-[85vw] md:min-w-[300px] max-w-[320px] h-full flex flex-col bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-200 dark:border-zinc-800 snap-x snap-mandatory ${col.borderColor}`}>
            {/* Column Header */}
            <div className={`p-3 border-b border-gray-100 dark:border-zinc-800 flex flex-col gap-1 bg-gray-50/50 dark:bg-zinc-800/30 snap-center snap-always`}>
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide">{col.title}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${col.color} ${col.iconColor}`}>
                        {col.orders.length}
                    </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                    {dishCount} Platos
                </div>
            </div>

            {/* Column Content */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar bg-gray-50/30 dark:bg-zinc-900/50">
                {col.orders.length === 0 ? (
                    <div className="text-center py-10 opacity-40">
                        <Package className="mx-auto h-8 w-8 mb-2" />
                        <span className="text-xs">Sin pedidos</span>
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    )
}

export default function OrdersPage() {
    const router = useRouter()
    const [orders, setOrders] = useState<DashboardOrder[]>([])
    const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(null)
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeOrder, setActiveOrder] = useState<DashboardOrder | null>(null);
    const [timeFilter, setTimeFilter] = useState<'24h' | 'all'>('24h');

    const [loading, setLoading] = useState(true)
    const [businessId, setBusinessId] = useState<string | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    const supabase = createClient()

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10, // Enable click on buttons without dragging immediately
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250, // Press and hold for 250ms to drag on touch
                tolerance: 5,
            },
        })
    );

    useEffect(() => {
        initializePage()
    }, [])

    const initializePage = async () => {
        try {
            console.log('Initializing Orders Page...')
            const business = await getCurrentBusinessman()
            if (!business) {
                console.error('No business found for current user.')
                return
            }

            // Guard: Essential plan cannot access orders page
            if (business.plan_type === 'essential') {
                toast.error('Tu plan actual no incluye gestión de pedidos. Mejora tu plan para acceder.', {
                    duration: 5000,
                    position: 'top-center',
                });
                router.replace('/billing');
                return;
            }

            setBusinessId(business.id)

            // Initial fetch
            await refreshOrders(business.id)

            // Subscribe to real-time updates
            const channel = supabase
                .channel(`orders-${business.id}`)
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
                    () => {
                        refreshOrders(business.id)
                    }
                )
                .subscribe((status) => {
                    setIsConnected(status === 'SUBSCRIBED')
                })

            const intervalId = setInterval(() => {
                refreshOrders(business.id)
            }, 45000)

            return () => {
                supabase.removeChannel(channel)
                clearInterval(intervalId)
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
        setLastUpdated(new Date())
        router.refresh()
    }

    const [audio] = useState<HTMLAudioElement | null>(typeof window !== 'undefined' ? new Audio('/notification.mp3') : null)

    const playNotificationSound = () => {
        if (audio) {
            audio.currentTime = 0
            audio.play().catch(e => console.error("Error playing sound:", e))
        }
    }

    const showNotification = (order: DashboardOrder) => {
        console.log("Showing notification for order:", order.id)
        playNotificationSound()

        toast.custom((t) => (
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-4 border-l-4 border-brand-primary w-full max-w-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors" onClick={() => {
                setSelectedOrder(order)
                toast.dismiss(t)
            }}>
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">¡Nuevo Pedido!</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {order.customer_name}
                        </p>
                        <p className="text-sm font-semibold text-brand-primary dark:text-brand-light mt-1">
                            ${order.total.toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-full">
                        <Bell className="h-5 w-5 text-brand-primary dark:text-brand-light" />
                    </div>
                </div>
                <div className="mt-3 flex justify-end">
                    <button
                        className="text-xs font-medium text-brand-primary dark:text-brand-light hover:text-brand-primary-hover"
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

        // Optimistic update
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))

        const result = await updateOrderStatus(orderId, newStatus)

        if (result.success && businessId) {
            // refreshOrders(businessId) // Not strictly needed if optimistic update works, but good for consistency
        } else {
            alert(`Error updating order status: ${result.error || 'Unknown error'}`)
            if (businessId) refreshOrders(businessId) // Revert on error
        }
    }



    // --- DnD Handlers ---
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id as string);
        setActiveOrder(active.data.current?.order || orders.find(o => o.id === active.id) || null);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const orderId = active.id as string;
            // The droppable id is the column id (e.g., 'pendiente', 'preparacion')
            // Map column IDs to OrderStatus. 
            // Note: 'preparacion' in columns maps to 'preparando' status?
            // Let's check the columns map below.

            // Map the internal column ID to actual OrderStatus
            const columnIdToStatus: Record<string, OrderStatus> = {
                'pendiente': 'pendiente',
                'preparacion': 'preparando',
                'listo': 'listo',
                'en_camino': 'en_camino',
                'entregado': 'entregado'
            };

            const newStatus = columnIdToStatus[over.id as string];

            if (newStatus) {
                // Check if status actually changed (ignoring same column drop)
                const currentOrder = orders.find(o => o.id === orderId);
                // Also check english mappings if needed, but we standardized on Spanish/mixed in types
                // Ideally verify if the status is valid for the order.

                if (currentOrder) {
                    // Simple optimistic update happens in handleStatusUpdate
                    await handleStatusUpdate(orderId, newStatus);
                }
            }
        }

        setActiveId(null);
        setActiveOrder(null);
    };

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
        )
    }

    const getDishCount = (orders: DashboardOrder[]) => {
        return orders.reduce((acc, order) => {
            return acc + (order.order_items?.reduce((itemAcc, item) => itemAcc + item.quantity, 0) || 0)
        }, 0)
    }

    const filteredOrders = orders.filter(order => {
        if (timeFilter === 'all') return true;
        if (!order.created_at) return true;
        const orderDate = new Date(order.created_at);
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return orderDate >= twentyFourHoursAgo;
    });

    const columns = [
        {
            id: 'pendiente',
            title: 'Nuevos',
            orders: filteredOrders.filter(o => o.status === 'pendiente' || o.status === 'pending'),
            color: 'bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700',
            iconColor: 'text-zinc-600 dark:text-zinc-400',
            borderColor: 'border-t-4 border-t-zinc-400'
        },
        {
            id: 'preparacion',
            title: 'Cocina',
            orders: filteredOrders.filter(o => ['confirmado', 'confirmed', 'preparando', 'preparing'].includes(o.status)),
            color: 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-900/50',
            iconColor: 'text-purple-600 dark:text-purple-400',
            borderColor: 'border-t-4 border-t-purple-500'
        },
        {
            id: 'listo',
            title: 'Listo',
            orders: filteredOrders.filter(o => ['listo', 'ready'].includes(o.status)),
            color: 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/50',
            iconColor: 'text-orange-600 dark:text-orange-400',
            borderColor: 'border-t-4 border-t-orange-500'
        },
        {
            id: 'en_camino',
            title: 'En Ruta',
            orders: filteredOrders.filter(o => ['en_camino', 'en_route', 'on_way'].includes(o.status)),
            color: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/50',
            iconColor: 'text-blue-600 dark:text-blue-400',
            borderColor: 'border-t-4 border-t-blue-500'
        },
        {
            id: 'entregado',
            title: 'Entregados',
            orders: filteredOrders.filter(o => ['entregado', 'delivered'].includes(o.status)).slice(0, 5),
            color: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/50',
            iconColor: 'text-green-600 dark:text-green-400',
            borderColor: 'border-t-4 border-t-green-500'
        }
    ]

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="h-[calc(100vh-8rem)] flex flex-col">
                <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Tablero de Control</h1>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${isConnected
                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                            : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                            }`}>
                            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                            {isConnected ? 'En vivo' : 'Desconectado'}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {lastUpdated && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <Clock className="w-3 h-3" />
                                Actualizado: {lastUpdated.toLocaleTimeString()}
                            </div>
                        )}
                        <button
                            onClick={() => businessId && refreshOrders(businessId)}
                            className="p-2.5 text-gray-500 hover:text-brand-primary hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                            title="Actualizar ahora"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="flex justify-end mb-4 px-1">
                    <div className="flex p-1 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                        <button
                            onClick={() => setTimeFilter('24h')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timeFilter === '24h'
                                ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            Últimas 24h
                        </button>
                        <button
                            onClick={() => setTimeFilter('all')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timeFilter === 'all'
                                ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            Todo el Historial
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 snap-x snap-mandatory scroll-smooth custom-scrollbar">
                    <div className="h-full flex gap-4 px-2" style={{ minWidth: 'max-content' }}>
                        {columns.map((col) => {
                            const dishCount = getDishCount(col.orders)

                            return (
                                <KanbanColumn key={col.id} col={col} dishCount={dishCount}>
                                    {col.orders.map((order) => (
                                        <DraggableOrderCard
                                            key={order.id}
                                            order={order}
                                            onStatusUpdate={handleStatusUpdate}
                                            onClick={setSelectedOrder}
                                        />
                                    ))}
                                </KanbanColumn>
                            )
                        })}
                    </div>
                </div>

                <DragOverlay dropAnimation={dropAnimation}>
                    {activeOrder ? (
                        <div className="opacity-90 rotate-2 scale-105 cursor-grabbing">
                            <OrderKanbanCard
                                order={activeOrder}
                                onStatusUpdate={() => { }} // No-op during drag
                                onClick={() => { }}
                            />
                        </div>
                    ) : null}
                </DragOverlay>

                {selectedOrder && (
                    <OrderDetailModal
                        order={selectedOrder}
                        onClose={() => setSelectedOrder(null)}
                        onUpdate={() => businessId && refreshOrders(businessId)}
                    />
                )}

            </div>
        </DndContext>
    )
}
