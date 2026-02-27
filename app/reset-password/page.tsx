'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

function PasswordStrength({ password }: { password: string }) {
    const checks = [
        { label: 'Al menos 8 caracteres', ok: password.length >= 8 },
        { label: 'Una letra mayúscula', ok: /[A-Z]/.test(password) },
        { label: 'Una letra minúscula', ok: /[a-z]/.test(password) },
        { label: 'Un número', ok: /[0-9]/.test(password) },
    ]
    const score = checks.filter(c => c.ok).length
    const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-emerald-500']
    const labels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte']

    if (!password) return null

    return (
        <div className="space-y-2 mt-2">
            {/* Barra de fuerza */}
            <div className="flex gap-1 h-1.5">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-gray-200 dark:bg-zinc-700'
                            }`}
                    />
                ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
                Fortaleza: <span className={`font-semibold ${score >= 3 ? 'text-green-600' : 'text-brand-primary'}`}>
                    {labels[score] || 'Muy débil'}
                </span>
            </p>
            {/* Checklist */}
            <ul className="space-y-1">
                {checks.map(({ label, ok }) => (
                    <li key={label} className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                        <CheckCircle2 className={`size-3.5 shrink-0 ${ok ? 'opacity-100' : 'opacity-30'}`} />
                        {label}
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    // Verify that the user has an active recovery session
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                toast.error('El enlace de recuperación no es válido o ya expiró.')
                router.push('/forgot-password')
            }
        }
        checkSession()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirm) {
            toast.error('Las contraseñas no coinciden.')
            return
        }
        if (password.length < 8) {
            toast.error('La contraseña debe tener al menos 8 caracteres.')
            return
        }

        setLoading(true)

        const { error } = await supabase.auth.updateUser({ password })

        if (error) {
            toast.error('Error al actualizar la contraseña: ' + error.message)
        } else {
            setSuccess(true)
            // Auto-redirect after 3 seconds
            setTimeout(() => router.push('/'), 3000)
        }

        setLoading(false)
    }

    return (
        <div className="flex min-h-screen bg-white dark:bg-zinc-950">

            {/* Panel izquierdo */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-zinc-900 border-r border-zinc-800">
                <div className="absolute inset-0 bg-linear-to-br from-emerald-600/20 via-brand-primary/10 to-brand-accent/20 z-0" />
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
                            <KeyRound className="size-8 text-brand-light" />
                        </div>
                        <h2 className="text-5xl font-bold leading-tight">
                            Crea una{' '}
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-brand-light to-brand-accent">
                                nueva contraseña
                            </span>{' '}
                            segura
                        </h2>
                        <p className="text-lg text-zinc-400">
                            Elige una contraseña robusta para proteger tu cuenta y la información de tu restaurante.
                        </p>
                    </div>
                    <p className="text-sm text-zinc-500">© 2026 FoodFast Pro</p>
                </div>
            </div>

            {/* Panel derecho */}
            <div className="flex flex-1 items-center justify-center px-4 sm:px-6 lg:px-20 xl:px-24 py-12">
                <div className="mx-auto w-full max-w-md">

                    <AnimatePresence mode="wait">
                        {!success ? (
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
                                        Nueva contraseña
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Elige una contraseña segura para tu cuenta de FoodFast Pro.
                                    </p>
                                </div>

                                {/* Formulario */}
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Password */}
                                    <div className="space-y-2">
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Nueva contraseña
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="block w-full rounded-lg border-0 py-3 pl-4 pr-11 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-primary dark:bg-zinc-800 dark:text-white dark:ring-gray-700 sm:text-sm sm:leading-6 transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(v => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                            </button>
                                        </div>
                                        <PasswordStrength password={password} />
                                    </div>

                                    {/* Confirm */}
                                    <div className="space-y-2">
                                        <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Confirmar contraseña
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="confirm"
                                                type={showConfirm ? 'text' : 'password'}
                                                required
                                                value={confirm}
                                                onChange={(e) => setConfirm(e.target.value)}
                                                placeholder="••••••••"
                                                className={`block w-full rounded-lg border-0 py-3 pl-4 pr-11 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset dark:bg-zinc-800 dark:text-white sm:text-sm sm:leading-6 transition-all ${confirm && password !== confirm
                                                    ? 'ring-red-400 focus:ring-red-500 dark:ring-red-600'
                                                    : confirm && password === confirm
                                                        ? 'ring-green-400 focus:ring-green-500 dark:ring-green-600'
                                                        : 'ring-gray-300 focus:ring-brand-primary dark:ring-gray-700'
                                                    }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirm(v => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                            >
                                                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                            </button>
                                        </div>
                                        {confirm && password !== confirm && (
                                            <p className="text-xs text-red-500">Las contraseñas no coinciden</p>
                                        )}
                                        {confirm && password === confirm && (
                                            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                                <CheckCircle2 className="size-3.5" /> Las contraseñas coinciden
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !password || !confirm || password !== confirm}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-3 py-3 text-sm font-semibold text-white hover:bg-brand-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-primary/20"
                                    >
                                        {loading ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            'Actualizar contraseña'
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-8 text-center"
                            >
                                <div className="flex justify-center">
                                    <div className="relative">
                                        <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
                                        <div className="relative flex size-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800">
                                            <CheckCircle2 className="size-10 text-green-600 dark:text-green-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        ¡Contraseña actualizada!
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Tu contraseña fue cambiada exitosamente. Serás redirigido al dashboard en unos segundos.
                                    </p>
                                </div>

                                <Link
                                    href="/"
                                    className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-6 py-3 text-sm font-semibold text-white hover:bg-brand-primary/90 transition-colors"
                                >
                                    Ir al dashboard ahora
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </div>
        </div>
    )
}
