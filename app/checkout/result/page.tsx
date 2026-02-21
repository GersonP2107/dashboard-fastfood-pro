import { verifyPaymentOutcome } from '@/lib/actions/payments';
import Link from 'next/link';
import { CheckCircle, XCircle } from 'lucide-react';

export default async function CheckoutResultPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { "bold-tx-status": status, "bold-order-id": orderId } = await searchParams as { "bold-tx-status": string, "bold-order-id": string };

    // Verify payment status with database
    const { success, status: finalStatus } = await verifyPaymentOutcome(orderId, status);

    // Check if approved
    const isApproved = finalStatus === 'approved';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 p-4">
            <div className="max-w-md w-full bg-white dark:bg-zinc-800 rounded-3xl shadow-xl p-8 text-center space-y-8 border border-gray-100 dark:border-zinc-700">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-lg animate-in zoom-in duration-300 ${isApproved ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-500' : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-500'}`}>
                    {isApproved ? <CheckCircle className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {isApproved ? '¡Pago Exitoso!' : 'Pago Fallido'}
                    </h1>

                    <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
                        {isApproved
                            ? 'Tu suscripción ha sido activada correctamente. Ya puedes disfrutar de todas las funcionalidades de FoodFast Pro.'
                            : 'Hubo un problema al procesar tu pago con Bold. Por favor intenta nuevamente o contacta a soporte.'}
                    </p>
                </div>

                <div className="pt-4">
                    <Link
                        href={isApproved ? '/' : '/billing'}
                        className={`block w-full py-4 px-6 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${isApproved
                            ? 'bg-brand-primary hover:bg-brand-secondary text-white shadow-brand-primary/30'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-white'
                            }`}
                    >
                        {isApproved ? 'Ir al Dashboard' : 'Volver a intentar'}
                    </Link>
                </div>

                <div className="text-xs text-gray-400">
                    ID Transacción: <span className="font-mono">{orderId || 'N/A'}</span>
                </div>
            </div>
        </div>
    );
}
