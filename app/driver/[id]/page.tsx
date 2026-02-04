"use client";

import { useEffect, useState } from "react";
import { getDriverOrder, confirmDelivery } from "@/lib/actions/driver";
import { DashboardOrder } from "@/lib/types";
import { MapPin, Phone, CheckCircle, Navigation, DollarSign, Package } from "lucide-react";
import { toast } from "sonner";

export default function DriverPage({ params }: { params: { id: string } }) {
    const [order, setOrder] = useState<DashboardOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [delivered, setDelivered] = useState(false);

    useEffect(() => {
        loadOrder();
    }, [params.id]);

    const loadOrder = async () => {
        try {
            const data = await getDriverOrder(params.id);
            if (data) {
                setOrder(data);
                if (data.status === 'entregado' || data.status === 'delivered') {
                    setDelivered(true);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!confirm("¿Confirmar que entregaste el pedido?")) return;

        setConfirming(true);
        const res = await confirmDelivery(params.id);
        if (res.success) {
            setDelivered(true);
            toast.success("¡Entrega registrada!");
        } else {
            toast.error("Hubo un error al registrar la entrega.");
        }
        setConfirming(false);
    };

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">Cargando pedido...</div>;
    if (!order) return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">Pedido no encontrado o enlace inválido.</div>;

    const isCash = order.payment_method === 'efectivo';
    // Google Maps Search Query
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address || '')}`;

    if (delivered) {
        return (
            <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-white p-8 rounded-full shadow-sm mb-6">
                    <CheckCircle className="w-16 h-16 text-green-500" />
                </div>
                <h1 className="text-3xl font-bold text-green-800 mb-2">¡Entregado!</h1>
                <p className="text-green-600 mb-8">El pedido #{order.order_number} ha sido finalizado correctamente.</p>
                <div className="text-sm text-gray-400">Ya puedes cerrar esta ventana.</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 pb-8">
            {/* Header */}
            <div className="bg-white p-6 shadow-sm pb-8 rounded-b-2xl">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pedido</span>
                        <h1 className="text-3xl font-black text-gray-900">#{order.order_number}</h1>
                    </div>
                    <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                        En Ruta
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold text-gray-400">
                        {order.customer_name.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{order.customer_name}</h2>
                        {order.customer_phone && (
                            <a href={`tel:${order.customer_phone}`} className="text-blue-600 text-sm font-medium flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3" /> Llamar al cliente
                            </a>
                        )}
                    </div>
                </div>
            </div>

            <div className="px-4 -mt-6 space-y-4">
                {/* Collect Card */}
                <div className={`shadow-lg rounded-2xl p-6 ${isCash ? 'bg-red-500 text-white' : 'bg-gray-800 text-white'}`}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium opacity-90 uppercase tracking-wide">
                            {isCash ? 'Cobrar al Cliente' : 'Ya Pagado'}
                        </span>
                        <DollarSign className="w-5 h-5 opacity-80" />
                    </div>
                    <div className="text-4xl font-black tracking-tight flex items-baseline gap-1">
                        ${order.total.toLocaleString()}
                        <span className="text-lg font-normal opacity-80 uppercase">{order.payment_method}</span>
                    </div>
                    {isCash && <p className="mt-2 text-sm text-red-100 font-medium">⚠️ Recuerda recibir el efectivo.</p>}
                </div>

                {/* Address & Maps Action */}
                <div className="bg-white shadow-sm rounded-2xl p-6">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="bg-blue-50 p-3 rounded-xl text-blue-600 shrink-0">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase">Dirección de Entrega</span>
                            <p className="text-lg font-medium text-gray-900 leading-snug mt-1">
                                {order.delivery_address || 'Sin dirección registrada'}
                            </p>
                            {order.delivery_notes && (
                                <p className="mt-2 text-sm bg-yellow-50 text-yellow-800 p-2 rounded border border-yellow-100">
                                    "{order.delivery_notes}"
                                </p>
                            )}
                        </div>
                    </div>

                    <a
                        href={mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-lg shadow-blue-200 shadow-lg active:scale-95 transition-all"
                    >
                        <Navigation className="w-5 h-5" />
                        Abrir GPS
                    </a>
                </div>

                {/* Confirm Action */}
                <button
                    onClick={handleConfirm}
                    disabled={confirming}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-70 text-white font-black py-5 rounded-2xl text-xl shadow-lg shadow-green-200 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    {confirming ? (
                        <span className="animate-pulse">Confirmando...</span>
                    ) : (
                        <>
                            <CheckCircle className="w-6 h-6" />
                            CONFIRMAR ENTREGA
                        </>
                    )}
                </button>

                <p className="text-center text-xs text-gray-400 pt-4 pb-10">
                    Al confirmar, el pedido se marcará como entregado en el sistema.
                </p>
            </div>
        </div>
    );
}
