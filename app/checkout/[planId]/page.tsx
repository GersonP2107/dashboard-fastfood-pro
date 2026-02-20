import { initiatePayment } from '@/lib/actions/payments';
import BoldPaymentWidget from '@/components/checkout/BoldPaymentWidget';
import { notFound } from 'next/navigation';
import { ShieldCheck, ArrowLeft, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { isTrialActive, getTrialDaysRemaining } from '@/lib/utils/trial';

export default async function CheckoutPage({ params }: { params: Promise<{ planId: string }> }) {
    const { planId } = await params;

    try {
        const paymentConfig = await initiatePayment(planId);

        const supabase = await createClient();
        const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).single();

        const trialActive = isTrialActive(paymentConfig.trialEndsAt);
        const trialDays = getTrialDaysRemaining(paymentConfig.trialEndsAt);

        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
                <div className="max-w-md w-full bg-white dark:bg-zinc-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-zinc-700">
                    {/* Trial urgency banner */}
                    {trialActive && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-6 py-3 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                                {trialDays <= 1
                                    ? '¡Tu prueba gratis termina hoy! Asegura tu plan ahora.'
                                    : `Tu prueba gratis termina en ${trialDays} días. Asegura tu acceso.`
                                }
                            </p>
                        </div>
                    )}

                    <div className="px-6 py-8 border-b border-gray-100 dark:border-zinc-700">
                        <div className="flex items-center justify-between mb-6">
                            <Link href="/billing" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Resumen de Compra</h2>
                            <div className="w-6" /> {/* Spacer */}
                        </div>

                        <div className="text-center">
                            <p className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">
                                Estás adquiriendo
                            </p>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {plan?.name}
                            </h1>
                            <div className="mt-4 flex items-baseline justify-center text-gray-900 dark:text-white">
                                <span className="text-5xl font-extrabold tracking-tight">
                                    ${plan?.price.toLocaleString()}
                                </span>
                                <span className="ml-1 text-xl text-gray-500">
                                    COP
                                </span>
                            </div>
                            <p className="mt-4 text-sm text-gray-500 max-w-xs mx-auto">
                                Acceso inmediato por {plan?.duration_days === 30 ? '1 mes' : plan?.duration_days === 365 ? '1 año' : `${plan?.duration_days} días`}. Sin renovación automática.
                            </p>
                        </div>
                    </div>

                    <div className="px-6 py-8 bg-gray-50 dark:bg-zinc-900/50 space-y-8">
                        {/* Security notice */}
                        <div className="flex gap-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl">
                            <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                                Pago procesado de forma segura por <strong>Bold</strong>. Tus datos financieros nunca tocan nuestros servidores.
                            </p>
                        </div>

                        {/* Bold Payment Button */}
                        <div className="min-h-[60px] flex items-center justify-center">
                            <BoldPaymentWidget config={paymentConfig} />
                        </div>

                        <p className="text-center text-[10px] text-gray-400">
                            Al completar el pago aceptas los Términos de Servicio y Política de Privacidad de FoodFast Pro.
                        </p>
                    </div>
                </div>
            </div>
        );
    } catch (e: any) {
        console.error("Checkout Error:", e);
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100 dark:border-zinc-700">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        No se pudo iniciar el pago
                    </h1>
                    <p className="text-sm text-red-500 font-medium mb-4 bg-red-50 dark:bg-red-900/10 p-3 rounded-lg wrap-break-words">
                        {e.message || "Error interno desconocido"}
                    </p>
                    <p className="text-xs text-gray-400 mb-6">
                        Plan ID: {planId}
                    </p>
                    <Link
                        href="/billing"
                        className="block w-full py-2.5 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:opacity-90 transition-opacity"
                    >
                        Volver a los planes
                    </Link>
                </div>
            </div>
        );
    }
}
