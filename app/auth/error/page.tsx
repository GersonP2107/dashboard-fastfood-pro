'use client'

import Link from 'next/link'
import { XCircle } from 'lucide-react'

export default function AuthErrorPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950 px-4">
            <div className="w-full max-w-md text-center space-y-6">
                <div className="flex justify-center">
                    <div className="flex size-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                        <XCircle className="size-10 text-red-600 dark:text-red-400" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Enlace inválido o expirado
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        El enlace de confirmación no es válido o ya expiró.
                        Puedes solicitar uno nuevo iniciando sesión.
                    </p>
                </div>
                <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-500 transition-colors"
                >
                    Ir al inicio de sesión
                </Link>
            </div>
        </div>
    )
}
