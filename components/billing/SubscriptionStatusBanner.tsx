"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle,
    XCircle,
    Clock,
    CheckCircle2,
    X,
    RefreshCcw,
} from "lucide-react";
import Link from "next/link";
import { getCurrentBusinessman } from "@/lib/actions/users";
import { Businessman } from "@/lib/types";

type AlertLevel = "ok" | "warning" | "urgent" | "expired";

interface SubscriptionInfo {
    status: string;
    subscriptionEnd: Date | null;
    planType: string;
    daysLeft: number;
    alertLevel: AlertLevel;
}

function computeInfo(biz: Businessman): SubscriptionInfo {
    const subscriptionEnd = biz.subscription_end ? new Date(biz.subscription_end) : null;
    const now = new Date();
    const msLeft = subscriptionEnd ? subscriptionEnd.getTime() - now.getTime() : null;
    const daysLeft = msLeft !== null ? Math.ceil(msLeft / (1000 * 60 * 60 * 24)) : 9999;

    let alertLevel: AlertLevel = "ok";
    if (biz.subscription_status === "expired" || daysLeft <= 0) {
        alertLevel = "expired";
    } else if (daysLeft <= 1) {
        alertLevel = "urgent";
    } else if (daysLeft <= 7) {
        alertLevel = "warning";
    }

    return {
        status: biz.subscription_status ?? "active",
        subscriptionEnd,
        planType: biz.plan_type ?? "essential",
        daysLeft,
        alertLevel,
    };
}

const LEVEL_CONFIG: Record<
    AlertLevel,
    {
        bg: string;
        border: string;
        icon: typeof AlertTriangle;
        iconColor: string;
        title: (d: number) => string;
        desc: (date: string) => string;
        ctaLabel: string;
        ctaClass: string;
    }
> = {
    ok: {
        bg: "bg-green-50 dark:bg-green-950/30",
        border: "border-green-200 dark:border-green-800",
        icon: CheckCircle2,
        iconColor: "text-green-500",
        title: (d) => `Suscripción activa · ${d} días restantes`,
        desc: (date) => `Tu plan está vigente hasta el ${date}.`,
        ctaLabel: "Ver planes",
        ctaClass: "bg-green-600 text-white hover:bg-green-700",
    },
    warning: {
        bg: "bg-amber-50 dark:bg-amber-950/30",
        border: "border-amber-200 dark:border-amber-800",
        icon: Clock,
        iconColor: "text-amber-500",
        title: (d) => `Tu suscripción vence en ${d} día${d !== 1 ? "s" : ""}`,
        desc: (date) =>
            `Renueva antes del ${date} para no perder el acceso a tu menú y dashboard.`,
        ctaLabel: "Renovar ahora",
        ctaClass: "bg-amber-500 text-white hover:bg-amber-600",
    },
    urgent: {
        bg: "bg-red-50 dark:bg-red-950/30",
        border: "border-red-200 dark:border-red-800",
        icon: AlertTriangle,
        iconColor: "text-red-500",
        title: () => "⚠️ Tu suscripción vence mañana",
        desc: (date) =>
            `Último aviso: si no renuevas hoy (${date}), mañana tu menú quedará inaccesible.`,
        ctaLabel: "Renovar urgente",
        ctaClass: "bg-red-600 text-white hover:bg-red-700 animate-pulse",
    },
    expired: {
        bg: "bg-gray-100 dark:bg-zinc-800/60",
        border: "border-gray-300 dark:border-zinc-700",
        icon: XCircle,
        iconColor: "text-gray-500",
        title: () => "Suscripción expirada",
        desc: (date) =>
            `Tu suscripción venció el ${date}. Renueva para reactivar tu menú digital y todas las funcionalidades.`,
        ctaLabel: "Reactivar suscripción",
        ctaClass: "bg-brand-primary text-white hover:bg-brand-primary-hover shadow-sm shadow-brand-primary/20",
    },
};

export default function SubscriptionStatusBanner() {
    const [info, setInfo] = useState<SubscriptionInfo | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        getCurrentBusinessman().then((biz) => {
            if (!biz) return;
            const computed = computeInfo(biz);
            // Only show for non-trivial states or near expiry
            if (computed.alertLevel !== "ok" || computed.daysLeft <= 14) {
                setInfo(computed);
            }
        });
    }, []);

    if (!info || dismissed) return null;

    // Skip banner for "ok" with many days left
    if (info.alertLevel === "ok" && info.daysLeft > 14) return null;

    const cfg = LEVEL_CONFIG[info.alertLevel];
    const Icon = cfg.icon;

    const expiryDateStr = info.subscriptionEnd
        ? info.subscriptionEnd.toLocaleDateString("es-CO", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })
        : "N/A";

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className={`relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:px-5 rounded-2xl border ${cfg.bg} ${cfg.border} mb-8`}
            >
                {/* Icon */}
                <span className={`shrink-0 mt-0.5 ${cfg.iconColor}`}>
                    <Icon className="h-5 w-5" />
                </span>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {cfg.title(info.daysLeft)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-snug">
                        {cfg.desc(expiryDateStr)}
                    </p>
                </div>

                {/* CTA */}
                <Link
                    href="/billing"
                    className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${cfg.ctaClass}`}
                >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    {cfg.ctaLabel}
                </Link>

                {/* Dismiss (only for ok / warning states) */}
                {(info.alertLevel === "ok" || info.alertLevel === "warning") && (
                    <button
                        onClick={() => setDismissed(true)}
                        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        aria-label="Cerrar aviso"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
