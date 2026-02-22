'use client'

import { useState } from 'react'
import { MailCheck, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function VerifyEmailPage() {
    const [resending, setResending] = useState(false)
    const supabase = createClient()

    // Try to get the email from localStorage (set during registration)
    const email = typeof window !== 'undefined'
        ? localStorage.getItem('pending_verification_email') ?? ''
        : ''

    const handleResend = async () => {
        if (!email) {
            toast.error('No se pudo determinar el correo. Por favor, regístrate de nuevo.')
            return
        }
        setResending(true)
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/confirm`,
            },
        })
        if (error) {
            toast.error('Error al reenviar: ' + error.message)
        } else {
            toast.success('¡Correo reenviado! Revisa tu bandeja de entrada.')
        }
        setResending(false)
    }

    return (
        <div className="flex min-h-screen bg-white dark:bg-zinc-950">
            {/* Panel izquierdo decorativo */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-zinc-900 border-r border-zinc-800">
                <div className="absolute inset-0 bg-linear-to-br from-orange-600/20 via-amber-600/10 to-red-600/20 z-0" />
                {/* Honeycomb / dots pattern */}
                <div className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #f97316 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                    }}
                />
                <div className="relative z-10 flex flex-col justify-between p-12 w-full h-full text-white">
                    <div>
                        <h1 className="text-3xl font-bold bg-linear-to-br from-orange-500 to-red-600 bg-clip-text text-transparent">
                            FoodFast Pro
                        </h1>
                    </div>
                    <div className="space-y-6 max-w-lg">
                        <div className="flex size-16 items-center justify-center rounded-2xl bg-orange-600/20 border border-orange-500/30">
                            <MailCheck className="size-8 text-orange-400" />
                        </div>
                        <h2 className="text-5xl font-bold leading-tight">
                            Un paso más para{' '}
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">
                                empezar
                            </span>
                        </h2>
                        <p className="text-lg text-zinc-400">
                            Verificamos los correos para asegurar la seguridad de tu cuenta y evitar accesos no deseados.
                        </p>
                    </div>
                    <p className="text-sm text-zinc-500">© 2026 FoodFast Pro</p>
                </div>
            </div>

            {/* Panel derecho */}
            <div className="flex flex-1 items-center justify-center px-4 sm:px-6 lg:px-20 xl:px-24 py-12">
                <div className="mx-auto w-full max-w-md space-y-8">

                    {/* Icono animado */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 animate-ping rounded-full bg-orange-500/20" />
                            <div className="relative flex size-20 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800">
                                <MailCheck className="size-10 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </div>

                    {/* Texto */}
                    <div className="text-center space-y-3">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Revisa tu correo
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            Te enviamos un enlace de confirmación a:
                        </p>
                        {email && (
                            <p className="text-base font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/10 rounded-lg px-4 py-2 border border-orange-100 dark:border-orange-800">
                                {email}
                            </p>
                        )}
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                            Haz clic en el enlace del correo para activar tu cuenta.
                            Si no lo ves, revisa la carpeta de spam.
                        </p>
                    </div>

                    {/* Pasos visuales */}
                    <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 p-5 space-y-3">
                        {[
                            { step: '1', text: 'Abre tu bandeja de entrada' },
                            { step: '2', text: 'Busca el correo de FoodFast Pro' },
                            { step: '3', text: 'Haz clic en "Confirmar correo"' },
                        ].map(({ step, text }) => (
                            <div key={step} className="flex items-center gap-3">
                                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-white">
                                    {step}
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-300">{text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Acciones */}
                    <div className="space-y-3">
                        <button
                            onClick={handleResend}
                            disabled={resending}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <RefreshCw className={`size-4 ${resending ? 'animate-spin' : ''}`} />
                            {resending ? 'Reenviando...' : 'Reenviar correo de confirmación'}
                        </button>

                        <Link
                            href="/login"
                            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                            <ArrowLeft className="size-4" />
                            Volver al inicio de sesión
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    )
}
