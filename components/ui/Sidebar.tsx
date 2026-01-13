
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, ListOrdered, Settings, LogOut, Package, DollarSign, Layers, X, History } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navigation = [
    { name: 'Panel', href: '/', icon: LayoutDashboard },
    { name: 'Ordenes', href: '/orders', icon: ListOrdered },
    { name: 'Historial', href: '/history', icon: History },
    { name: 'Productos', href: '/products', icon: ShoppingBag },
    { name: 'Categorías', href: '/categories', icon: Layers },
    { name: 'Inventario', href: '/inventory', icon: Package },
    { name: 'Finanzas', href: '/finance', icon: DollarSign },
    { name: 'Configuración', href: '/settings', icon: Settings },
]

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

interface SidebarProps {
    business?: {
        id: string;
        business_name: string;
        logo_url?: string;
    } | null;
    onCloseMobile?: () => void;
}

export default function Sidebar({ business, onCloseMobile }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
    }

    return (
        <div className="flex h-full w-64 flex-col gap-y-5 overflow-y-auto bg-gray-50/50 dark:bg-zinc-950 px-4 pb-4">
            <div className="flex h-20 shrink-0 items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    {business?.logo_url ? (
                        <div className="h-10 w-10 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 p-1.5 shadow-sm">
                            <img src={business.logo_url} alt={business.business_name} className="h-full w-full rounded-xl object-cover" />
                        </div>
                    ) : (
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            {business?.business_name?.charAt(0) || 'D'}
                        </div>
                    )}
                    <span className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[120px]">
                        {business?.business_name || 'DigitalMenu'}
                    </span>
                </div>

                {onCloseMobile && (
                    <button
                        onClick={onCloseMobile}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-zinc-900/50 rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>
            <nav className="flex flex-1 flex-col px-2">
                <ul role="list" className="flex flex-1 flex-col gap-y-1">
                    <li>
                        <ul role="list" className="space-y-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            onClick={onCloseMobile}
                                            className={classNames(
                                                isActive
                                                    ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-zinc-900/50',
                                                'group flex gap-x-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all'
                                            )}
                                        >
                                            <item.icon
                                                className={classNames(
                                                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300',
                                                    'h-5 w-5 shrink-0'
                                                )}
                                                aria-hidden="true"
                                            />
                                            {item.name}
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </li>
                    <li className="mt-auto">
                        <button
                            onClick={handleSignOut}
                            className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 group flex gap-x-3 rounded-2xl px-3 py-2.5 text-sm font-medium w-full transition-all"
                        >
                            <LogOut
                                className="text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 h-5 w-5 shrink-0"
                                aria-hidden="true"
                            />
                            Cerrar sesión
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    )
}
