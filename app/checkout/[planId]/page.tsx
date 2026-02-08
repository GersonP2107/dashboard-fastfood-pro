import { initiatePayment } from '@/lib/actions/payments';
import BoldPaymentWidget from '@/components/checkout/BoldPaymentWidget';
import { notFound } from 'next/navigation';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function CheckoutPage({ params }: { params: { planId: string } }) {
    try {
        const paymentConfig = await initiatePayment(params.planId);

        const supabase = await createClient();
        const { data: plan } = await supabase.from('plans').select('*').eq('id', params.planId).single();

        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
                <div className="max-w-md w-full bg-white dark:bg-zinc-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-zinc-700">
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
                                Acceso inmediato por {plan?.duration_days} días. Sin renovación automática.
                            </p>
                        </div>
                    </div>

                    <div className="px-6 py-8 bg-gray-50 dark:bg-zinc-900/50 space-y-8">
                        <div className="flex gap-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl">
                            <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                                Pago procesado de forma segura por <strong>Bold</strong>. Tus datos financieros nunca tocan nuestros servidores.
                            </p>
                        </div>

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
    } catch (e) {
        console.error(e);
        return notFound();
    }
}
