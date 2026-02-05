'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CreditCard, MapPin, Layout, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import { getPaymentMethods } from '@/lib/actions/payment-methods';
import { getDeliveryZones } from '@/lib/actions/settings';
import { getZones } from '@/lib/actions/tables';

interface SetupGuideProps {
    businessmanId: string;
}

interface MissingItem {
    id: string;
    title: string;
    description: string;
    href: string;
    icon: React.ElementType;
    isMissing: boolean;
}

export default function SetupGuide({ businessmanId }: SetupGuideProps) {
    const [missingItems, setMissingItems] = useState<MissingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (!businessmanId) return;

        const checkConfiguration = async () => {
            try {
                // Fetch counts/existence
                const [paymentMethods, deliveryZones, tableZones] = await Promise.all([
                    getPaymentMethods(businessmanId),
                    getDeliveryZones(businessmanId),
                    getZones(businessmanId)
                ]);

                const items: MissingItem[] = [
                    {
                        id: 'payments',
                        title: 'Métodos de Pago',
                        description: 'Configura cómo te van a pagar tus clientes.',
                        href: '/settings',
                        icon: CreditCard,
                        isMissing: paymentMethods.length === 0
                    },
                    {
                        id: 'delivery',
                        title: 'Zonas de Domicilio',
                        description: 'Define a dónde envías tus pedidos y cuánto cuesta.',
                        href: '/settings',
                        icon: MapPin,
                        isMissing: deliveryZones.length === 0
                    },
                    {
                        id: 'tables',
                        title: 'Mesas y Zonas',
                        description: 'Crea tus zonas y mesas para el sistema POS.',
                        href: '/settings',
                        icon: Layout,
                        isMissing: tableZones.length === 0
                    }
                ];

                setMissingItems(items.filter(item => item.isMissing));
            } catch (error) {
                console.error("Error checking configuration:", error);
            } finally {
                setLoading(false);
            }
        };

        checkConfiguration();
    }, [businessmanId]);

    if (loading || missingItems.length === 0 || !isVisible) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 rounded-3xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 p-6 relative overflow-hidden"
            >
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-orange-100 dark:bg-orange-800/20 rounded-full blur-3xl opacity-50 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-6">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-2xl shrink-0">
                        <AlertCircle className="w-8 h-8 text-brand-primary" />
                    </div>

                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                    Completa la configuración de tu negocio
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                    Para que tu negocio funcione al 100%, te recomendamos configurar las siguientes secciones:
                                </p>
                            </div>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {missingItems.map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 border border-orange-100 dark:border-orange-900/20 rounded-xl hover:shadow-md hover:border-brand-primary/30 transition-all group"
                                >
                                    <div className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-lg group-hover:bg-brand-primary/10 transition-colors">
                                        <item.icon className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-brand-primary transition-colors" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                            {item.title}
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {item.description}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-primary transition-colors" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
