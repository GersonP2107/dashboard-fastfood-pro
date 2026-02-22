'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            toast.error("Error al iniciar sesión: " + error.message)
            setLoading(false)
        } else {
            toast.success("¡Bienvenido de nuevo!")
            router.push('/')
            router.refresh()
        }
    }

    return (
        <div className="flex min-h-screen bg-white dark:bg-black">
            {/* Lado Izquierdo: Visuales */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-zinc-900 border-r border-zinc-800">
                <div className="absolute inset-0 bg-linear-to-br from-blue-900/40 via-purple-900/40 to-orange-900/40 z-0" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />

                <div className="relative z-10 flex flex-col justify-between p-12 w-full h-full text-white">
                    <div className="space-y-2 shrink-0">
                        <h1 className="text-3xl font-bold bg-linear-to-br from-orange-500 to-red-600 bg-clip-text text-transparent">
                            FoodFast Pro
                        </h1>
                    </div>

                    <div className="space-y-6 max-w-lg">
                        <h2 className="text-6xl font-bold leading-tight">
                            Tu cocina,<br />
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-600">digitalizada</span>.
                        </h2>
                        <p className="text-lg text-zinc-400">
                            Inicia sesión para gestionar pedidos, actualizar menús y monitorear entregas en tiempo real.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                        <p>© 2026 FoodFast Pro</p>
                    </div>
                </div>
            </div>

            {/* Lado Derecho: Formulario */}
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 py-12">
                <div className="mx-auto w-full max-w-md space-y-8">
                    <div>
                        <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                            Bienvenido de nuevo
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            ¿No tienes una cuenta?{' '}
                            <Link href="/register" className="font-semibold text-orange-600 hover:text-orange-500 transition-colors">
                                Regístrate gratis
                            </Link>
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Correo Electrónico
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="block w-full rounded-lg border-0 py-3 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 dark:bg-zinc-800 dark:text-white dark:ring-gray-700 sm:text-sm sm:leading-6 transition-all"
                                    placeholder="juan@ejemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Contraseña
                                    </label>
                                    <Link href="/forgot-password" className="text-sm font-semibold text-orange-600 hover:text-orange-500">
                                        ¿Olvidaste tu contraseña?
                                    </Link>
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="block w-full rounded-lg border-0 py-3 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 dark:bg-zinc-800 dark:text-white dark:ring-gray-700 sm:text-sm sm:leading-6 transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative flex w-full justify-center rounded-lg bg-orange-600 px-3 py-3 text-sm font-semibold text-white hover:bg-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-600/20"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <span className="flex items-center">
                                        Iniciar Sesión <ArrowRight className="ml-2 h-4 w-4" />
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
