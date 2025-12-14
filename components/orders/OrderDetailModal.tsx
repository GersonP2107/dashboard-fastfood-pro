'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardOrder, OrderStatus } from '@/lib/types'
import { X, MapPin, Phone, CreditCard, Clock, Package, CheckCircle } from 'lucide-react'
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
    preparando: 'en_camino',
    en_camino: 'entregado',
    entregado: null,
    cancelado: null,
}

const STATUS_LABELS: Record<OrderStatus, string> = {
    pendiente: 'Pendiente',
    confirmado: 'Confirmado',
    preparando: 'En Preparación',
    en_camino: 'Listo para Entregar',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
}

const NEXT_STATUS_LABELS: Record<OrderStatus, string> = {
    pendiente: 'Aceptar Pedido',
    confirmado: 'Iniciar Preparación',
    preparando: 'Marcar como Listo',
    en_camino: 'Marcar como Entregado',
    entregado: '',
    cancelado: '',
}

export default function OrderDetailModal({ order, onClose, onUpdate }: OrderDetailModalProps) {
    const [updating, setUpdating] = useState(false)
    const [paymentConfirmed, setPaymentConfirmed] = useState(false)
    const supabase = createClient()

    const updateOrderStatus = async (newStatus: OrderStatus) => {
        setUpdating(true)
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', order.id)

            if (error) throw error

            // Log status change
            await supabase.from('order_status_history').insert({
                order_id: order.id,
                status: newStatus,
                notes: `Estado cambiado de ${order.status} a ${newStatus}`,
            })

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
            updateOrderStatus(nextStatus)
        }
    }

    const handleReject = () => {
        if (confirm('¿Estás seguro de rechazar este pedido?')) {
            updateOrderStatus('cancelado')
        }
    }

    const confirmPayment = async () => {
        setPaymentConfirmed(true)
        // You could update a payment_confirmed field in the database here
    }

    const nextStatus = STATUS_FLOW[order.status]

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

                <div className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Pedido #{order.order_number}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Status & Time */}
                        <div className="flex items-center justify-between">
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                                {STATUS_LABELS[order.status]}
                            </span>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Clock className="h-4 w-4" />
                                {format(new Date(order.created_at), "d 'de' MMMM, HH:mm", { locale: es })}
                            </div>
                        </div>

                        {/* Client Info */}
                        <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 space-y-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Cliente</h3>
                            <div className="flex items-center gap-2 text-sm">
                                <Package className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-700 dark:text-gray-300">{order.client_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-700 dark:text-gray-300">{order.client_phone}</span>
                            </div>
                            {order.delivery_type === 'delivery' && order.delivery_address && (
                                <div className="flex items-start gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                    <span className="text-gray-700 dark:text-gray-300">{order.delivery_address}</span>
                                </div>
                            )}
                            {order.delivery_notes && (
                                <div className="text-sm text-gray-600 dark:text-gray-400 italic">
                                    Nota: {order.delivery_notes}
                                </div>
                            )}
                        </div>

                        {/* Payment Info */}
                        <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Pago</h3>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <CreditCard className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-700 dark:text-gray-300 capitalize">
                                        {order.payment_method}
                                    </span>
                                </div>
                                {order.payment_method === 'transferencia' && !paymentConfirmed && (
                                    <button
                                        onClick={confirmPayment}
                                        className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                    >
                                        Confirmar Pago
                                    </button>
                                )}
                                {paymentConfirmed && (
                                    <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <CheckCircle className="h-4 w-4" />
                                        Confirmado
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Order Items */}
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Productos</h3>
                            <div className="space-y-3">
                                {order.order_items?.map((item) => (
                                    <div key={item.id} className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {item.quantity}x {item.product_name}
                                            </div>
                                            {item.modifiers && item.modifiers.length > 0 && (
                                                <div className="text-sm text-gray-600 dark:text-gray-400 ml-4">
                                                    {item.modifiers.map((mod: { id: string; modifier_name: string; additional_price: number }) => (
                                                        <div key={mod.id}>
                                                            + {mod.modifier_name}
                                                            {mod.additional_price > 0 && ` (+$${mod.additional_price})`}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            ${item.subtotal.toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Total */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                                <span className="text-gray-900 dark:text-white">${order.subtotal.toLocaleString()}</span>
                            </div>
                            {order.shipping_cost > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Envío</span>
                                    <span className="text-gray-900 dark:text-white">${order.shipping_cost.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold">
                                <span className="text-gray-900 dark:text-white">Total</span>
                                <span className="text-gray-900 dark:text-white">${order.total.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            {order.status === 'pendiente' && (
                                <>
                                    <button
                                        onClick={handleNextStatus}
                                        disabled={updating}
                                        className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {updating ? 'Procesando...' : 'Aceptar Pedido'}
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        disabled={updating}
                                        className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                                    >
                                        Rechazar
                                    </button>
                                </>
                            )}
                            {nextStatus && order.status !== 'pendiente' && (
                                <button
                                    onClick={handleNextStatus}
                                    disabled={updating}
                                    className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {updating ? 'Procesando...' : NEXT_STATUS_LABELS[order.status]}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
