'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Check, Trash2, X, Crown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DashboardOrder } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import useSound from 'use-sound'

export interface AppNotification {
    id: string
    title: string
    message: string
    createdAt: number
    read: boolean
    link?: string
    type: 'order' | 'system'
}

interface NotificationCenterProps {
    businessId: string | undefined
    planType?: 'essential' | 'professional' | 'premium'
}

// Map of restricted routes per plan
const PLAN_RESTRICTED_ROUTES: Record<string, string[]> = {
    essential: ['/orders', '/history', '/inventory', '/finance'],
    professional: ['/finance'],
    premium: [],
};

export default function NotificationCenter({ businessId, planType = 'essential' }: NotificationCenterProps) {
    const [notifications, setNotifications] = useState<AppNotification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [audio] = useState<HTMLAudioElement | null>(typeof window !== 'undefined' ? new Audio('/notification.mp3') : null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    // Derived state
    const unreadCount = notifications.filter(n => !n.read).length

    // Load from LocalStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('dashboard_notifications')
        if (stored) {
            try {
                setNotifications(JSON.parse(stored))
            } catch (e) {
                console.error("Failed to parse notifications", e)
            }
        }
    }, [])

    // Save to LocalStorage on update
    useEffect(() => {
        if (notifications.length > 0) {
            localStorage.setItem('dashboard_notifications', JSON.stringify(notifications))
        }
    }, [notifications])

    // Subscription
    useEffect(() => {
        if (!businessId) return

        const supabase = createClient()
        const channel = supabase
            .channel(`notifications-${businessId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                    filter: `businessman_id=eq.${businessId}`
                },
                (payload) => {
                    const newOrder = payload.new as DashboardOrder

                    const restrictedRoutes = PLAN_RESTRICTED_ROUTES[planType] || [];
                    const isOrdersRestricted = restrictedRoutes.includes('/orders');

                    const newNotification: AppNotification = {
                        id: crypto.randomUUID(),
                        title: '¡Nuevo Pedido!',
                        message: `${newOrder.customer_name} - $${newOrder.total.toLocaleString()}`,
                        createdAt: Date.now(),
                        read: false,
                        link: isOrdersRestricted ? undefined : '/orders',
                        type: 'order'
                    }

                    setNotifications(prev => [newNotification, ...prev])
                    playNotificationSound()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [businessId])

    // System Configuration Check
    useEffect(() => {
        if (!businessId) return;

        const checkSystemConfig = async () => {
            // Dynamically import actions to avoid server/client issues if any, duplicate logic but clean
            // Actually better to import them at top but let's see imports.
            // We need to import these at the top level of the file.

            const { getPaymentMethods } = await import('@/lib/actions/payment-methods');
            const { getDeliveryZones } = await import('@/lib/actions/settings');
            const { getZones } = await import('@/lib/actions/tables');

            try {
                const [paymentMethods, deliveryZones, tableZones] = await Promise.all([
                    getPaymentMethods(businessId),
                    getDeliveryZones(businessId),
                    getZones(businessId)
                ]);

                const alerts: AppNotification[] = [];

                if (paymentMethods.length === 0) {
                    alerts.push({
                        id: 'sys-missing-payments',
                        title: 'Faltan Métodos de Pago',
                        message: 'Tus clientes no podrán pagar. Configura métodos de pago ahora.',
                        createdAt: Date.now(),
                        read: false,
                        link: '/settings',
                        type: 'system'
                    });
                }

                if (deliveryZones.length === 0) {
                    alerts.push({
                        id: 'sys-missing-delivery',
                        title: 'Sin Zonas de Domicilio',
                        message: 'No has definido a dónde envías pedidos.',
                        createdAt: Date.now(),
                        read: false,
                        link: '/settings',
                        type: 'system'
                    });
                }

                if (tableZones.length === 0) {
                    alerts.push({
                        id: 'sys-missing-tables',
                        title: 'Sin Mesas Configuradas',
                        message: 'Configura tus mesas para usar el sistema QR.',
                        createdAt: Date.now(),
                        read: false,
                        link: '/settings',
                        type: 'system'
                    });
                }

                setNotifications(prev => {
                    // Merge alerts with existing notifications, avoiding duplicates by ID
                    const existingIds = new Set(prev.map(n => n.id));
                    const newAlerts = alerts.filter(a => !existingIds.has(a.id));

                    if (newAlerts.length === 0) return prev;

                    // If alerts were previously read (checked via ID matching in filtered list? No, local storage stores read state)
                    // We need to respect if user read them in this session/storage.
                    // But if they are still missing, maybe we should remind them?
                    // For now, let's just add them if they aren't in the list at all.
                    // If the user cleared them, they shouldn't reappear instantly unless we force it.
                    // But 'clearAll' clears the list. 
                    // Let's assume if it's missing from the list, we re-add it.

                    return [...newAlerts, ...prev];
                });

            } catch (error) {
                console.error("Error checking system config:", error);
            }
        };

        // Run check on mount and maybe infrequently? Just mount is fine.
        checkSystemConfig();

    }, [businessId]);

    // Click outside handler
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [dropdownRef])

    const playNotificationSound = () => {
        if (audio) {
            audio.currentTime = 0
            audio.play().catch(e => console.error("Error playing sound:", e))
        }
    }

    const markAsRead = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    }

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }

    const clearAll = () => {
        setNotifications([])
        localStorage.removeItem('dashboard_notifications')
    }

    const handleNotificationClick = (n: AppNotification) => {
        if (!n.read) {
            markAsRead(n.id, { stopPropagation: () => { } } as any)
        }
        setIsOpen(false)

        // If it's an order notification and user is on essential plan, show upgrade prompt
        const restrictedRoutes = PLAN_RESTRICTED_ROUTES[planType] || [];
        if (n.type === 'order' && restrictedRoutes.includes('/orders')) {
            toast(
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-linear-to-br from-amber-400 to-orange-500 shrink-0">
                        <Crown className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">Gestión de Pedidos</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Mejora tu plan para gestionar pedidos desde el tablero de control.
                        </p>
                        <button
                            onClick={() => {
                                router.push('/billing')
                                toast.dismiss()
                            }}
                            className="mt-2 text-xs font-semibold text-brand-primary hover:text-brand-primary-hover transition-colors"
                        >
                            Ver planes →
                        </button>
                    </div>
                </div>,
                { duration: 6000, position: 'top-center' }
            );
            return;
        }

        if (n.link) {
            router.push(n.link)
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                className={`text-gray-400 hover:text-gray-500 relative transition-transform ${unreadCount > 0 ? 'animate-pulse text-indigo-500' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="sr-only">View notifications</span>
                <Bell className={`h-6 w-6 ${unreadCount > 0 && !isOpen ? 'swing-animation' : ''}`} aria-hidden="true" />

                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-bounce-short">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 z-50 mt-2 w-80 sm:w-96 origin-top-right rounded-xl bg-white dark:bg-zinc-900 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100 dark:border-zinc-800"
                    >
                        <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50/50 dark:bg-zinc-800/50 rounded-t-xl">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notificaciones</h3>
                            <div className="flex gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium flex items-center gap-1"
                                        title="Marcar todo como leído"
                                    >
                                        <Check className="w-3 h-3" /> Leídas
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button
                                        onClick={clearAll}
                                        className="text-xs text-red-500 hover:text-red-700 font-medium ml-2"
                                        title="Borrar todo"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="py-12 text-center">
                                    <Bell className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Sin notificaciones</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
                                    {notifications.map((notification) => (
                                        <li
                                            key={notification.id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`p-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer relative group ${!notification.read ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''
                                                }`}
                                        >
                                            <div className="flex justify-between items-start gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium ${!notification.read ? 'text-indigo-900 dark:text-indigo-200' : 'text-gray-900 dark:text-gray-200'}`}>
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-1">
                                                        {formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: es })}
                                                    </p>
                                                    {/* Show upgrade hint for restricted order notifications */}
                                                    {notification.type === 'order' && !notification.link && (
                                                        <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-full">
                                                            <Crown className="w-2.5 h-2.5" />
                                                            Plan Pro requerido
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    {!notification.read && (
                                                        <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0" />
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                @keyframes swing {
                    0%, 100% { transform: rotate(0deg); }
                    20% { transform: rotate(15deg); }
                    40% { transform: rotate(-10deg); }
                    60% { transform: rotate(5deg); }
                    80% { transform: rotate(-5deg); }
                }
                .swing-animation {
                    animation: swing 2s infinite ease-in-out;
                    transform-origin: top center;
                }
                @keyframes bounce-short {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
                .animate-bounce-short {
                   animation: bounce-short 1s infinite;
                }
            `}</style>
        </div>
    )
}
