'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShieldCheck, Crown, Zap, Star, Sparkles, LayoutDashboard } from 'lucide-react';
import { getPlans } from '@/lib/actions/payments';
import { Plan } from '@/lib/types/payments';
import SubscriptionStatusBanner from '@/components/billing/SubscriptionStatusBanner';
import Link from 'next/link';

type BillingPeriod = 'monthly' | 'annual';

const PERIOD_CONFIG: Record<BillingPeriod, { label: string; shortLabel: string; days: number }> = {
    monthly: { label: 'Mensual', shortLabel: '/mes', days: 30 },
    annual: { label: 'Anual', shortLabel: '/año', days: 365 },
};

const PLAN_TIER_CONFIG: Record<string, { icon: typeof Zap; gradient: string; order: number; label: string }> = {
    essential: {
        icon: LayoutDashboard,
        gradient: 'from-slate-500 to-gray-600',
        order: 0,
        label: 'Esencial',
    },
    professional: {
        icon: Star,
        gradient: 'from-orange-500 to-amber-500',
        order: 1,
        label: 'Profesional',
    },
    premium: {
        icon: Crown,
        gradient: 'from-violet-600 to-indigo-600',
        order: 2,
        label: 'Premium + IA',
    },
};

function getFeatures(planType: string): string[] {
    switch (planType) {
        case 'essential':
            return [
                'Menú Digital QR (Básico)',
                'Recepción de Pedidos',
                'Hasta 30 Productos',
                'Analíticas Básicas',
                'Soporte por Email'
            ];
        case 'professional':
            return [
                'Menú Digital QR Ilimitado',
                'Gestión de Pedidos en Tiempo Real',
                'Analíticas de Ventas Avanzadas',
                'Impresión de Comandas',
                'Soporte Prioritario por WhatsApp'
            ];
        case 'premium':
            return [
                'Todo lo incluido en Profesional',
                'Asistente IA 24/7 (Soporte Clientes)',
                'Recomendaciones Inteligentes de Menú',
                'Reportes Financieros Detallados',
                'Soporte VIP Exclusivo'
            ];
        default:
            return [];
    }
}

export default function BillingPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState<BillingPeriod>('annual'); // Default to annual for higher conversion

    useEffect(() => {
        getPlans().then(setPlans).finally(() => setLoading(false));
    }, []);

    const filteredPlans = useMemo(() => {
        // Only show Paid plans (Essential, Professional & Premium) matching the period duration
        const targetDays = PERIOD_CONFIG[selectedPeriod].days;
        return plans
            .filter(p => (
                p.plan_type === 'essential' ||
                p.plan_type === 'professional' ||
                p.plan_type === 'premium'
            ) && p.duration_days === targetDays)
            .sort((a, b) => {
                const orderA = PLAN_TIER_CONFIG[a.plan_type]?.order ?? 99;
                const orderB = PLAN_TIER_CONFIG[b.plan_type]?.order ?? 99;
                return orderA - orderB;
            });
    }, [plans, selectedPeriod]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Subscription Status Alert Banner */}
                <SubscriptionStatusBanner />
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-wider"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Potencia tu Restaurante</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight"
                    >
                        Planes simples y transparentes
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-gray-500 dark:text-gray-400"
                    >
                        Sin costos ocultos. Cancela cuando quieras.
                    </motion.p>
                </div>

                {/* Intelligent Toggle */}
                <div className="flex justify-center">
                    <div className="relative bg-gray-100 dark:bg-zinc-800 p-1.5 rounded-2xl flex items-center shadow-inner">
                        {/* Monthly Option */}
                        <button
                            onClick={() => setSelectedPeriod('monthly')}
                            className={`relative px-8 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 z-10 ${selectedPeriod === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            {selectedPeriod === 'monthly' && (
                                <motion.div
                                    layoutId="toggle-bg"
                                    className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-xl shadow-sm border border-gray-200/50 dark:border-zinc-600"
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                            <span className="relative">Mensual</span>
                        </button>

                        {/* Annual Option */}
                        <button
                            onClick={() => setSelectedPeriod('annual')}
                            className={`relative px-8 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 z-10 ${selectedPeriod === 'annual' ? 'text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            {selectedPeriod === 'annual' && (
                                <motion.div
                                    layoutId="toggle-bg"
                                    className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-xl shadow-sm border border-gray-200/50 dark:border-zinc-600"
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                            <div className="relative flex items-center gap-2">
                                <span>Anual</span>
                                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                                    2 Meses Gratis
                                </span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Plan Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {filteredPlans.length > 0 ? (
                        filteredPlans.map((plan, index) => {
                            const config = PLAN_TIER_CONFIG[plan.plan_type];
                            const features = getFeatures(plan.plan_type);
                            // Calculate monthly equivalent for annual view context
                            const monthlyPrice = selectedPeriod === 'annual' ? Math.round(plan.price / 12) : plan.price;

                            return (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
                                    className={`relative flex flex-col group rounded-3xl overflow-hidden border bg-white dark:bg-zinc-900 transition-all duration-300 ${plan.plan_type === 'professional'
                                        ? 'border-brand-primary shadow-xl shadow-brand-primary/10 ring-1 ring-brand-primary scale-[1.02] z-10'
                                        : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700'
                                        }`}
                                >
                                    {/* Most Popular Badge for Professional */}
                                    {plan.plan_type === 'professional' && (
                                        <div className="absolute top-0 inset-x-0 bg-brand-primary text-white text-center text-xs font-bold uppercase tracking-widest py-1.5 z-20">
                                            Recomendado
                                        </div>
                                    )}

                                    <div className={`p-8 flex-1 flex flex-col ${plan.plan_type === 'professional' ? 'pt-10' : ''}`}>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className={`p-2.5 rounded-xl bg-linear-to-br ${config.gradient} shadow-lg`}>
                                                <config.icon className="w-5 h-5 text-white" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                {config.label}
                                            </h3>
                                        </div>

                                        <div className="flex items-baseline gap-1 mb-2">
                                            <span className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                                ${plan.price.toLocaleString()}
                                            </span>
                                            <span className="text-lg font-medium text-gray-500 dark:text-gray-400">
                                                COP
                                            </span>
                                        </div>

                                        <div className="mb-8 min-h-[24px]">
                                            {selectedPeriod === 'annual' ? (
                                                <div className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1.5">
                                                    <Check className="w-4 h-4" />
                                                    Pagas solo 10 meses
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    Facturado mensualmente
                                                </div>
                                            )}
                                        </div>

                                        <ul className="space-y-4 mb-8 flex-1">
                                            {features.map((feature, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${plan.plan_type === 'professional'
                                                        ? 'bg-brand-primary/10'
                                                        : 'bg-green-100 dark:bg-green-900/30'
                                                        }`}>
                                                        <Check className={`w-3 h-3 ${plan.plan_type === 'professional'
                                                            ? 'text-brand-primary'
                                                            : 'text-green-600 dark:text-green-400'
                                                            }`} />
                                                    </div>
                                                    <span className="text-sm text-gray-600 dark:text-gray-300 leading-snug">
                                                        {feature}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>

                                        <Link
                                            href={`/checkout/${plan.id}`}
                                            className={`block w-full py-4 px-6 rounded-xl text-center font-bold text-sm transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mt-auto ${plan.plan_type === 'professional'
                                                ? 'bg-brand-primary text-white hover:bg-brand-secondary shadow-brand-primary/25'
                                                : plan.plan_type === 'premium'
                                                    ? 'bg-linear-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-indigo-500/20'
                                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-700'
                                                }`}
                                        >
                                            {plan.plan_type === 'essential' ? 'Empezar Básico' : 'Seleccionar Plan'}
                                        </Link>

                                        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-gray-400 uppercase tracking-wide">
                                            <ShieldCheck className="w-3 h-3" />
                                            Pago Seguro vía Bold
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-12 text-center text-gray-500">
                            Cargando planes actualizados...
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
