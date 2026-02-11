'use client';

import { useState, useEffect } from 'react';
import { getTrialDaysRemaining, isTrialActive } from '@/lib/utils/trial';
import { Clock, Sparkles, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface TrialBannerProps {
    trialEndsAt: string | null | undefined;
    subscriptionStatus: string;
}

export default function TrialBanner({ trialEndsAt, subscriptionStatus }: TrialBannerProps) {
    const [dismissed, setDismissed] = useState(false);
    const [daysLeft, setDaysLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        if (trialEndsAt) {
            setDaysLeft(getTrialDaysRemaining(trialEndsAt));
            setIsActive(isTrialActive(trialEndsAt));
        }
    }, [trialEndsAt]);

    // Don't show if:
    // - No trial set
    // - User already has an active paid subscription
    // - Trial is not active (expired)
    // - Banner was dismissed this session
    if (!trialEndsAt || subscriptionStatus === 'active' && !isActive || !isActive || dismissed) {
        return null;
    }

    const isUrgent = daysLeft <= 2;
    const trialEndDate = new Date(trialEndsAt).toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'long',
    });

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 ${isUrgent
                    ? 'bg-linear-to-r from-red-50 to-orange-50 dark:from-red-950/40 dark:to-orange-950/40 border-red-200 dark:border-red-800/50'
                    : 'bg-linear-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800/50'
                    }`}
            >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-bl from-orange-200/30 to-transparent dark:from-orange-600/10 rounded-bl-full" />

                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className={`shrink-0 p-2 rounded-xl ${isUrgent
                            ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                            : 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400'
                            }`}>
                            {isUrgent ? <Clock className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className={`text-sm font-bold ${isUrgent
                                ? 'text-red-800 dark:text-red-300'
                                : 'text-orange-800 dark:text-orange-300'
                                }`}>
                                {isUrgent
                                    ? `¡Tu prueba gratis termina ${daysLeft === 0 ? 'hoy' : daysLeft === 1 ? 'mañana' : `en ${daysLeft} días`}!`
                                    : `Prueba Gratis — ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'} restantes`
                                }
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                {isUrgent
                                    ? `Suscríbete antes del ${trialEndDate} para no perder acceso a tu menú digital.`
                                    : `Estás disfrutando de todas las funciones del Plan Profesional gratis hasta el ${trialEndDate}.`
                                }
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Link
                            href="/billing"
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md ${isUrgent
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-orange-600 hover:bg-orange-700 text-white'
                                }`}
                        >
                            Elegir Plan <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                            onClick={() => setDismissed(true)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-colors"
                            aria-label="Cerrar"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-1.5 bg-white/60 dark:bg-zinc-800/60 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(0, ((7 - daysLeft) / 7) * 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${isUrgent
                            ? 'bg-linear-to-r from-red-400 to-red-600'
                            : 'bg-linear-to-r from-orange-400 to-orange-600'
                            }`}
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
