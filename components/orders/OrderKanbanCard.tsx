import { DashboardOrder, OrderStatus } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, DollarSign, Package, Phone, AlertTriangle, CreditCard, ChevronRight, X } from 'lucide-react'
import { motion } from 'framer-motion'

interface OrderKanbanCardProps {
    order: DashboardOrder
    onStatusUpdate: (orderId: string, newStatus: OrderStatus) => void
    onClick: (order: DashboardOrder) => void
}

export default function OrderKanbanCard({ order, onStatusUpdate, onClick }: OrderKanbanCardProps) {
    const isTransfer = order.payment_method === 'transferencia' || order.payment_method === 'transfer'
    const isCash = order.payment_method === 'efectivo' || order.payment_method === 'cash'

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
                bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-3 cursor-pointer hover:shadow-md transition-all
                border-l-[6px] ${urgencyColor}
                ${isTransfer && (order.status === 'pendiente' || order.status === 'pending') ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}
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
                <span className="truncate font-medium text-gray-700 dark:text-gray-300 max-w-[60%]">{order.customer_name}</span>
                <span className="font-bold text-gray-900 dark:text-white">${order.total.toLocaleString()}</span>
            </div>

            {/* Payment Badge (Only show if needing verify or strict cash) */}
            <div className="mb-3">
                {isTransfer ? (
                    <div className="flex items-center gap-1 text-xs font-bold text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
                        <AlertTriangle className="w-3 h-3" /> VERIFICAR PAGO
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                        <DollarSign className="w-3 h-3" /> Efectivo
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
                {['en_camino', 'en_route'].includes(order.status) && (
                    <button
                        onClick={(e) => handleAction(e, 'entregado')}
                        className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded shadow-sm transition-colors"
                    >
                        FINALIZAR
                    </button>
                )}
            </div>
        </motion.div>
    )
}
