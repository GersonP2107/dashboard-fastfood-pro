'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import { getPlans } from '@/lib/actions/payments';
import { Plan } from '@/lib/types/payments';
import Link from 'next/link';

export default function BillingPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPlans().then(setPlans).finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 p-4 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium mb-4"
                    >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Acceso Limitado / Suscripción Vencida</span>
                    </motion.div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                        Elige tu Plan Ideal
                    </h1>
                    <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                        Desbloquea todo el potencial de tu negocio con nuestros planes diseñados para crecer contigo.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative rounded-3xl p-8 border ${plan.plan_type === 'professional'
                                    ? 'bg-white dark:bg-zinc-800 border-brand-primary shadow-xl shadow-brand-primary/10 ring-1 ring-brand-primary'
                                    : 'bg-white dark:bg-zinc-800 border-gray-100 dark:border-zinc-700 shadow-lg'
                                }`}
                        >
                            {plan.plan_type === 'professional' && (
                                <div className="absolute top-0 right-0 -mt-4 mr-4 px-4 py-1.5 bg-brand-primary text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
                                    Más Popular
                                </div>
                            )}

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                                        {plan.name}
                                    </h3>
                                    <div className="mt-4 flex items-baseline text-gray-900 dark:text-white">
                                        <span className="text-4xl font-bold tracking-tight">
                                            ${plan.price.toLocaleString()}
                                        </span>
                                        <span className="ml-1 text-sm font-semibold text-gray-500">
                                            /{plan.duration_days === 30 ? 'mes' : 'año'}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                        {plan.description}
                                    </p>
                                </div>

                                <ul className="space-y-4">
                                    {[
                                        'Menú Digital QR',
                                        plan.plan_type !== 'essential' ? 'Productos Ilimitados' : 'Hasta 30 Productos',
                                        plan.plan_type !== 'essential' ? 'Analíticas Avanzadas' : 'Analíticas Básicas',
                                        plan.plan_type === 'premium' ? 'Asistente IA 24/7' : null,
                                        'Soporte Prioritario'
                                    ].filter(Boolean).map((feature, i) => (
                                        <li key={i} className="flex items-start">
                                            <div className="shrink-0 p-1 bg-green-50 dark:bg-green-900/20 rounded-full mr-3">
                                                <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href={`/checkout/${plan.id}`}
                                    className={`w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl transition-all duration-200 ${plan.plan_type === 'professional'
                                            ? 'bg-brand-primary hover:bg-brand-secondary text-white shadow-lg shadow-brand-primary/25'
                                            : 'bg-gray-50 hover:bg-gray-100 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-900 dark:text-white'
                                        }`}
                                >
                                    Seleccionar Plan
                                </Link>

                                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                                    <ShieldCheck className="w-4 h-4" />
                                    Pago seguro vía Bold
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
