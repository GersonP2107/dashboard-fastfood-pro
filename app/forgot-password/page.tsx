'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight, MailCheck, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return

        setLoading(true)

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${appUrl}/auth/confirm`,
        })

        if (error) {
            toast.error('Error al enviar el correo: ' + error.message)
        } else {
            setSent(true)
        }

        setLoading(false)
    }

    return (
        <div className="flex min-h-screen bg-white dark:bg-zinc-950">

            {/* Panel izquierdo decorativo */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-zinc-900 border-r border-zinc-800">
                <div className="absolute inset-0 bg-linear-to-br from-blue-600/20 via-brand-primary/10 to-brand-accent/20 z-0" />
                <div
                    className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #f97316 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                    }}
                />
                <div className="relative z-10 flex flex-col justify-between p-12 w-full h-full text-white">
                    <div className="shrink-0">
                        <img
                            src="/logo-horizontal-white.svg"
                            alt="FoodFast Pro"
                            className="h-14 w-auto"
                        />
                    </div>
                    <div className="space-y-6 max-w-lg">
                        <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-primary/20 border border-brand-primary/30">
                            <svg className="size-8 text-brand-light" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                        <h2 className="text-5xl font-bold leading-tight">
                            Recupera el acceso a tu{' '}
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-brand-light to-brand-accent">
                                cuenta
                            </span>
                        </h2>
                        <p className="text-lg text-zinc-400">
                            Te enviaremos un enlace seguro para que puedas crear una nueva contraseña en segundos.
                        </p>
                    </div>
                    <p className="text-sm text-zinc-500">© 2026 FoodFast Pro</p>
                </div>
            </div>

            {/* Panel derecho */}
            <div className="flex flex-1 items-center justify-center px-4 sm:px-6 lg:px-20 xl:px-24 py-12">
                <div className="mx-auto w-full max-w-md">

                    <AnimatePresence mode="wait">
                        {!sent ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                className="space-y-8"
                            >
                                {/* Header */}
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        ¿Olvidaste tu contraseña?
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Ingresa tu correo y te enviamos un enlace para restablecerla.
                                    </p>
                                </div>

                                {/* Formulario */}
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Correo electrónico
                                        </label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="juan@ejemplo.com"
                                            className="block w-full rounded-lg border-0 py-3 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-primary dark:bg-zinc-800 dark:text-white dark:ring-gray-700 sm:text-sm sm:leading-6 transition-all"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !email}
                                        className="group relative flex w-full justify-center items-center gap-2 rounded-lg bg-brand-primary px-3 py-3 text-sm font-semibold text-white hover:bg-brand-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-primary/20"
                                    >
                                        {loading ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <>Enviar enlace de recuperación <ArrowRight className="size-4" /></>
                                        )}
                                    </button>
                                </form>

                                <Link
                                    href="/login"
                                    className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                >
                                    <ArrowLeft className="size-4" /> Volver al inicio de sesión
                                </Link>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-8 text-center"
                            >
                                {/* Icono animado */}
                                <div className="flex justify-center">
                                    <div className="relative">
                                        <div className="absolute inset-0 animate-ping rounded-full bg-brand-primary/90/20" />
                                        <div className="relative flex size-20 items-center justify-center rounded-full bg-brand-primary/12 dark:bg-brand-primary/15 border-2 border-brand-primary/20 dark:border-brand-primary/40">
                                            <MailCheck className="size-10 text-brand-primary dark:text-brand-light" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        ¡Correo enviado!
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Enviamos el enlace de recuperación a:
                                    </p>
                                    <p className="text-base font-semibold text-brand-primary dark:text-brand-light bg-brand-primary/8 dark:bg-brand-primary/10 rounded-lg px-4 py-2 border border-brand-primary/15 dark:border-brand-primary/40 inline-block">
                                        {email}
                                    </p>
                                    <p className="text-sm text-gray-400 dark:text-gray-500">
                                        Haz clic en el enlace del correo para crear tu nueva contraseña.
                                        Si no lo ves, revisa la carpeta de spam.
                                    </p>
                                </div>

                                {/* Pasos */}
                                <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 p-5 space-y-3 text-left">
                                    {[
                                        'Abre tu bandeja de entrada',
                                        'Busca el correo de FoodFast Pro',
                                        'Haz clic en "Restablecer contraseña"',
                                    ].map((text, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">
                                                {i + 1}
                                            </span>
                                            <span className="text-sm text-gray-600 dark:text-gray-300">{text}</span>
                                        </div>
                                    ))}
                                </div>

                                <Link
                                    href="/login"
                                    className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                >
                                    <ArrowLeft className="size-4" /> Volver al inicio de sesión
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </div>
        </div>
    )
}
