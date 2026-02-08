import { DashboardOrder, OrderStatus } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, DollarSign, Package, Phone, AlertTriangle, CreditCard, ChevronRight, X, Bike, Store, MapPin, Send } from 'lucide-react'
import { motion } from 'framer-motion'

interface OrderKanbanCardProps {
    order: DashboardOrder
    onStatusUpdate: (orderId: string, newStatus: OrderStatus) => void
    onClick: (order: DashboardOrder) => void
}

export default function OrderKanbanCard({ order, onStatusUpdate, onClick }: OrderKanbanCardProps) {
    const normalizedPayment = order.payment_method?.toLowerCase() || '';
    const isTransfer = ['transfer', 'transferencia', 'nequi', 'daviplata', 'bancolombia'].some(m => normalizedPayment.includes(m));
    const isDineIn = order.delivery_type === 'dine_in' || !!order.restaurant_tables
    const isCash = normalizedPayment === 'efectivo';

    const getProductSummary = () => {
        if (!order.order_items || order.order_items.length === 0) return 'Sin productos'
        const summary = order.order_items.slice(0, 2).map(item => `${item.quantity}x ${item.product_name}`).join(', ')
        if (order.order_items.length > 2) return `${summary} +${order.order_items.length - 2}`
        return summary
    }

    // Traffic Light Logic
    const minutesElapsed = order.created_at ? (new Date().getTime() - new Date(order.created_at).getTime()) / 60000 : 0
    let urgencyColor = 'border-l-green-500' // < 15 min
    if (minutesElapsed > 15) urgencyColor = 'border-l-yellow-500' // > 15 min
    if (minutesElapsed > 30) urgencyColor = 'border-l-red-500' // > 30 min

    // Override urgency color border if it's a pending transfer to make it VERY visible
    const borderStyle = isTransfer && (order.status === 'pendiente' || order.status === 'pending')
        ? 'border-2 border-yellow-400 dark:border-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.3)]'
        : `border border-gray-200 dark:border-zinc-700 border-l-[6px] ${urgencyColor}`;

    const handleAction = (e: React.MouseEvent, status: OrderStatus) => {
        e.stopPropagation()
        onStatusUpdate(order.id, status)
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => onClick(order)}
            className={`
                bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-3 cursor-pointer hover:shadow-md transition-all
                ${borderStyle}
            `}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                    <span className="font-bold text-gray-900 dark:text-white text-lg">#{order.order_number}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(order.created_at), { locale: es })}
                    </span>
                </div>
                {/* Origin Icon */}
                <div className="p-1.5 rounded-full bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300">
                    {order.delivery_type === 'pickup' ? <Package className="w-4 h-4" /> : <div className="flex items-center"><span className="text-xs mr-1">🛵</span></div>}
                </div>
            </div>

            {/* Product Summary */}
            <div className="mb-3 p-2 bg-gray-50 dark:bg-zinc-900/50 rounded border border-gray-100 dark:border-zinc-800 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                {getProductSummary()}
            </div>

            {/* Customer & Total */}
            <div className="flex justify-between items-center mb-3 text-sm">
                <span className="truncate font-medium text-gray-700 dark:text-gray-300 max-w-[60%]">
                    {(isDineIn && order.customer_name.toLowerCase().includes('mesa')) ? 'Cliente en Mesa' : order.customer_name}
                </span>
                <span className="font-bold text-gray-900 dark:text-white">${order.total.toLocaleString()}</span>
            </div>

            {/* Badges Container */}
            <div className="mb-3 flex flex-wrap gap-2">
                {/* Delivery Type Badge */}
                {order.delivery_type === 'delivery' && (
                    <div className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded border border-blue-100 dark:border-blue-900/30">
                        <Bike className="w-3 h-3" /> DOMICILIO
                    </div>
                )}

                {order.delivery_type === 'pickup' && (
                    <div className="flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded border border-orange-100 dark:border-orange-900/30">
                        <Store className="w-3 h-3" /> RECOGER
                    </div>
                )}

                {/* Dine In / Table Badge */}
                {(order.delivery_type === 'dine_in' || order.restaurant_tables) && (
                    <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded border border-indigo-100 dark:border-indigo-900/30">
                        <Store className="w-3 h-3" />
                        {order.restaurant_tables ? (
                            <span>{order.restaurant_tables.restaurant_zones?.name} - {order.restaurant_tables.label}</span>
                        ) : (
                            // Fallback: Use customer_name if it looks like table info (common in some POS integrations)
                            <span>{order.customer_name || 'EN MESA'}</span>
                        )}
                    </div>
                )}

                {/* Payment Badge - Hide for Dine In */}
                {/* Payment Badge - Hide for Dine In */}
                {!isDineIn && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded border ${isTransfer
                        ? "text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-900/30"
                        : "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30"
                        }`}>
                        {isTransfer ? (
                            <>
                                <AlertTriangle className="w-3 h-3" /> TRANSFERENCIA
                            </>
                        ) : (
                            <>
                                <DollarSign className="w-3 h-3" /> {isCash ? 'EFECTIVO' : order.payment_method?.toUpperCase()}
                            </>
                        )}
                    </div>
                )}

                {/* Modifiers Badge */}
                {order.order_items?.some(item => item.modifiers && item.modifiers.length > 0) && (
                    <div className="flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded border border-purple-100 dark:border-purple-900/30">
                        <AlertTriangle className="w-3 h-3" /> CON EXTRAS
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-auto">
                {(order.status === 'pendiente' || order.status === 'pending') && (
                    <>
                        <button
                            onClick={(e) => handleAction(e, 'confirmado')}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded shadow-sm transition-colors"
                        >
                            ACEPTAR
                        </button>
                        <button
                            onClick={(e) => handleAction(e, 'cancelado')}
                            className="w-8 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-600 rounded transition-colors"
                            title="Rechazar"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </>
                )}
                {['confirmado', 'confirmed'].includes(order.status) && (
                    <button
                        onClick={(e) => handleAction(e, 'preparando')}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 rounded shadow-sm transition-colors"
                    >
                        A PREPARAR
                    </button>
                )}
                {['preparando', 'preparing'].includes(order.status) && (
                    <button
                        onClick={(e) => handleAction(e, 'listo')}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold py-2 rounded shadow-sm transition-colors"
                    >
                        LISTO / PACKING
                    </button>
                )}
                {['listo', 'ready'].includes(order.status) && (
                    <button
                        onClick={(e) => handleAction(e, 'en_camino')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded shadow-sm transition-colors"
                    >
                        ENVIAR / RUTA
                    </button>
                )}
                {['en_camino', 'en_route', 'on_way'].includes(order.status) && (
                    <div className="flex gap-2 w-full">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const link = `${window.location.origin}/driver/${order.id}`;
                                const text = `🛵 *Entrega Pedido #${order.order_number}*\n\n👤 Cliente: ${order.customer_name}\n📍 Dirección: ${order.delivery_address}\n💰 Total: $${order.total.toLocaleString()}\n\n🔗 *Gestionar Entrega aquí:* ${link}`;
                                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded shadow-sm transition-colors flex items-center justify-center"
                            title="Enviar al Repartidor (WhatsApp)"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => handleAction(e, 'entregado')}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded shadow-sm transition-colors"
                        >
                            FINALIZAR
                        </button>
                    </div>
                )}
            </div>
        </motion.div >
    )
}
