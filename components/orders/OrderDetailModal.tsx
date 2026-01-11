'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateOrderStatus } from '@/lib/actions/orders'
import { DashboardOrder, OrderStatus } from '@/lib/types'
import { X, MapPin, Phone, CreditCard, Clock, Package, CheckCircle, AlertTriangle, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface OrderDetailModalProps {
    order: DashboardOrder
    onClose: () => void
    onUpdate: () => void
}

const STATUS_FLOW: Record<OrderStatus, OrderStatus | null> = {
    pendiente: 'confirmado',
    confirmado: 'preparando',
    preparando: 'listo',
    listo: 'en_camino',
    en_camino: 'entregado',
    entregado: null,
    cancelado: null,
    // English Keys
    pending: 'confirmed',
    confirmed: 'preparing',
    preparing: 'ready',
    ready: 'en_route',
    en_route: 'delivered',
    delivered: null,
    cancelled: null,
}

const STATUS_LABELS: Record<OrderStatus, string> = {
    pendiente: 'Pendiente',
    confirmado: 'Confirmado',
    preparando: 'En Preparación',
    listo: 'Listo / Packing',
    en_camino: 'En Ruta',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
    // English Keys
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    preparing: 'En Preparación',
    ready: 'Listo / Packing',
    en_route: 'En Ruta',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
}

const NEXT_STATUS_LABELS: Record<OrderStatus, string> = {
    pendiente: 'Aceptar Pedido',
    confirmado: 'Iniciar Preparación',
    preparando: 'Marcar Listo / Packing',
    listo: 'Enviar Pedido',
    en_camino: 'Marcar Entregado',
    entregado: '',
    cancelado: '',
    // English Keys
    pending: 'Aceptar Pedido',
    confirmed: 'Iniciar Preparación',
    preparing: 'Marcar Listo / Packing',
    ready: 'Enviar Pedido',
    en_route: 'Marcar Entregado',
    delivered: '',
    cancelled: '',
}

export default function OrderDetailModal({ order, onClose, onUpdate }: OrderDetailModalProps) {
    const [updating, setUpdating] = useState(false)
    const [paymentConfirmed, setPaymentConfirmed] = useState(false)
    const supabase = createClient()

    const handleStatusUpdate = async (newStatus: OrderStatus) => {
        setUpdating(true)
        try {
            const result = await updateOrderStatus(order.id, newStatus)

            if (!result.success) {
                throw new Error(result.error || 'Error updating order')
            }

            // Status history is now handled by the server action
            onUpdate()
            onClose()
        } catch (error) {
            console.error('Error updating order:', error)
            alert('Error al actualizar el pedido')
        } finally {
            setUpdating(false)
        }
    }




    const handleNextStatus = () => {
        const nextStatus = STATUS_FLOW[order.status]
        if (nextStatus) {
            handleStatusUpdate(nextStatus)
        }
    }

    const handleCancel = () => {
        if (confirm('¿Estás seguro de cancelar este pedido? Esta acción no se puede deshacer.')) {
            handleStatusUpdate('cancelado')
        }
    }

    const handleReject = () => {
        if (confirm('¿Estás seguro de rechazar este pedido?')) {
            handleStatusUpdate('cancelado')
        }
    }

    const confirmPayment = async () => {
        setPaymentConfirmed(true)
    }

    const nextStatus = STATUS_FLOW[order.status]

    const getPaymentStyles = (method: string) => {
        const m = method.toLowerCase()
        if (m.includes('transferencia') || m.includes('transfer')) {
            return {
                bg: 'bg-yellow-100 dark:bg-yellow-900/30',
                text: 'text-yellow-800 dark:text-yellow-200',
                border: 'border-yellow-200 dark:border-yellow-700',
                icon: <AlertTriangle className="w-5 h-5" />,
                label: 'Transferencia - Requiere Verificación'
            }
        }
        if (m.includes('efectivo') || m.includes('cash')) {
            return {
                bg: 'bg-green-100 dark:bg-green-900/30',
                text: 'text-green-800 dark:text-green-200',
                border: 'border-green-200 dark:border-green-700',
                icon: <DollarSign className="w-5 h-5" />,
                label: 'Efectivo - Cobrar al Entregar'
            }
        }
        return {
            bg: 'bg-gray-100 dark:bg-gray-800',
            text: 'text-gray-800 dark:text-gray-200',
            border: 'border-gray-200 dark:border-gray-700',
            icon: <CreditCard className="w-5 h-5" />,
            label: 'Tarjeta / Otro'
        }
    }

    const paymentStyle = getPaymentStyles(order.payment_method)

    // Check if it's a POS/Dine-in order
    const isDineIn = order.delivery_type === 'dine_in' || !!order.restaurant_tables

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 text-left">
            {/* Backdrop Blur */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Pedido #{order.order_number}
                            </h2>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border
                                ${order.status === 'pendiente' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    order.status === 'entregado' ? 'bg-green-50 text-green-700 border-green-200' :
                                        'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                                {STATUS_LABELS[order.status]}
                            </span>
                            {!isDineIn && (
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${paymentStyle.bg} ${paymentStyle.text} ${paymentStyle.border}`}>
                                    {order.payment_method}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <Clock className="h-3.5 w-3.5" />
                            {format(new Date(order.created_at), "d 'de' MMMM, h:mm a", { locale: es })}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                    {/* Payment Warning Banner (If Pending) - HIDE FOR DINE IN */}
                    {!paymentConfirmed && !isDineIn && (order.status === 'pendiente' || order.status === 'confirmado') && (
                        <div className={`p-4 rounded-xl border flex items-center gap-4 ${paymentStyle.bg} ${paymentStyle.border}`}>
                            <div className={`p-2 rounded-full bg-white dark:bg-black/10 ${paymentStyle.text}`}>
                                {paymentStyle.icon}
                            </div>
                            <div className="flex-1">
                                <h3 className={`font-bold text-lg ${paymentStyle.text}`}>
                                    {paymentStyle.label}
                                </h3>
                                {(order.payment_method.includes('transfer') || order.payment_method.includes('Transfer')) && (
                                    <p className={`text-sm opacity-90 ${paymentStyle.text}`}>
                                        Verifica que el dinero haya ingresado a la cuenta antes de aceptar.
                                    </p>
                                )}
                            </div>
                            {order.payment_method === 'transferencia' && (
                                <button
                                    onClick={confirmPayment}
                                    className="px-4 py-2 bg-white dark:bg-black/20 text-sm font-bold rounded-lg shadow-sm hover:opacity-90 transition-opacity"
                                >
                                    Confirmar Pago
                                </button>
                            )}
                        </div>
                    )}

                    {/* Customer & Delivery Grid - SIMPLIFIED FOR DINE IN */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Customer Info */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
                                <Package className="h-4 w-4" /> Cliente
                            </h3>
                            <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 space-y-3 h-full">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold">
                                        {order.customer_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{order.customer_name}</p>
                                        {!isDineIn && (
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Phone className="h-3 w-3" />
                                                {order.customer_phone}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Info OR Table Info */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
                                <MapPin className="h-4 w-4" /> {isDineIn ? 'Ubicación' : 'Entrega'}
                            </h3>
                            <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 space-y-3 h-full text-sm">
                                {isDineIn ? (
                                    // Dine In / POS View
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">Tipo:</span>
                                            <span className="font-bold text-indigo-600 dark:text-indigo-400">Consumo en Local</span>
                                        </div>
                                        {order.restaurant_tables ? (
                                            <div className="mt-1 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-900/30 text-center">
                                                <p className="text-xs text-indigo-500 dark:text-indigo-400 uppercase font-bold tracking-wider mb-1">
                                                    {order.restaurant_tables.restaurant_zones?.name || 'Zona'}
                                                </p>
                                                <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                                                    {order.restaurant_tables.label}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="p-2 bg-yellow-50 text-yellow-800 rounded border border-yellow-200">
                                                Sin mesa asignada
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // Delivery / Pickup View
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Tipo:</span>
                                            <span className="font-medium capitalize text-gray-900 dark:text-white">{order.delivery_type === 'pickup' ? 'Recoger en Tienda' : 'Domicilio'}</span>
                                        </div>
                                        {order.delivery_type === 'delivery' && (
                                            <div className="flex justify-between items-start">
                                                <span className="text-gray-500">Dirección:</span>
                                                <span className="font-medium text-right text-gray-900 dark:text-white max-w-[60%]">{order.delivery_address || 'N/A'}</span>
                                            </div>
                                        )}
                                        {order.delivery_notes && (
                                            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-200 text-xs rounded border border-yellow-100 dark:border-yellow-900/20">
                                                <strong>Nota:</strong> {order.delivery_notes}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Order Items List */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">
                            Productos ({order.order_items?.length || 0})
                        </h3>
                        <div className="divide-y divide-gray-100 dark:divide-zinc-800 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                            {order.order_items?.map((item) => (
                                <div key={item.id} className="p-4 flex gap-4 bg-white dark:bg-zinc-900/50 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 font-bold text-sm">
                                        {item.quantity}x
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900 dark:text-white">{item.product_name}</h4>
                                        {item.modifiers && item.modifiers.length > 0 && (
                                            <div className="mt-2 space-y-1 bg-gray-50 dark:bg-zinc-800 p-2 rounded-md border border-gray-100 dark:border-zinc-700">
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Extras / Modificadores:</p>
                                                {item.modifiers.map((mod: { id: string; modifier_name: string; additional_price: number }) => (
                                                    <div key={mod.id} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                                                        <span className="font-medium">{mod.modifier_name}</span>
                                                        {mod.additional_price > 0 && <span className="text-indigo-600 dark:text-indigo-400 font-bold">(+${mod.additional_price.toLocaleString()})</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                        ${item.subtotal.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals Section */}
                    <div className="flex justify-end">
                        <div className="w-full sm:w-1/2 space-y-3 bg-gray-50 dark:bg-zinc-800/30 p-4 rounded-xl">
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                <span>Subtotal</span>
                                <span>${order.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                <span>Envío</span>
                                <span>${order.shipping_cost.toLocaleString()}</span>
                            </div>
                            {/* Tip Display */}
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                <span>Propina</span>
                                <span className={order.tip ? "text-green-600 dark:text-green-400 font-medium" : ""}>
                                    ${(order.tip || 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="pt-3 border-t border-gray-200 dark:border-zinc-700 flex justify-between items-center">
                                <span className="font-bold text-gray-900 dark:text-white text-lg">Total</span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-2xl">${order.total.toLocaleString()}</span>
                            </div>
                            {/* Small Payment Method Reminder in Totals - Hide explicitly if user wants all invisible, but usually total is relevant */}
                            {!isDineIn && (
                                <div className={`mt-2 text-right text-xs font-bold uppercase tracking-wide ${paymentStyle.text}`}>
                                    Método de Pago: {order.payment_method}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-gray-50 dark:bg-zinc-900/80 border-t border-gray-100 dark:border-zinc-800 flex gap-3 sticky bottom-0 z-10 backdrop-blur-md">
                    {order.status === 'pendiente' ? (
                        <>
                            <button
                                onClick={handleReject}
                                disabled={updating}
                                className="flex-1 px-4 py-3 bg-white text-red-600 border border-gray-200 hover:bg-red-50 font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
                            >
                                Rechazar
                            </button>
                            <button
                                onClick={handleNextStatus}
                                disabled={updating}
                                className="flex-[2] px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {updating ? 'Procesando...' : 'Aceptar Pedido'} <CheckCircle className="w-5 h-5" />
                            </button>
                        </>
                    ) : (
                        nextStatus && (
                            <>
                                <button
                                    onClick={handleCancel}
                                    disabled={updating}
                                    className="flex-1 px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300 font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleNextStatus}
                                    disabled={updating}
                                    className="flex-[2] px-4 py-3 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {updating ? 'Actualizando...' : NEXT_STATUS_LABELS[order.status]}
                                </button>
                            </>
                        )
                    )}
                </div>

            </div>
        </div>
    )
}
