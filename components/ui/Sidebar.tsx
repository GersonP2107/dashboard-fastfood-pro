
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, ListOrdered, Settings, LogOut, Package, DollarSign, Layers, X, History } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { isTrialActive, getTrialDaysRemaining } from '@/lib/utils/trial'

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
        plan_type?: 'essential' | 'professional' | 'premium';
        trial_ends_at?: string | null;
    } | null;
    onCloseMobile?: () => void;
}

export default function Sidebar({ business, onCloseMobile }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    // Filter navigation based on plan
    const plan = business?.plan_type || 'essential';

    const filteredNavigation = navigation.filter(item => {
        if (plan === 'essential') {
            return !['Ordenes', 'Historial', 'Inventario', 'Finanzas'].includes(item.name);
        }
        if (plan === 'professional') {
            return !['Finanzas'].includes(item.name);
        }
        return true; // premium sees all
    });

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
    }

    return (
        <div className="flex h-full flex-col gap-y-6 overflow-y-auto bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800 px-4 pb-4">
            <div className="flex flex-col shrink-0 items-center justify-center px-2 py-6 relative">
                {onCloseMobile && (
                    <button
                        onClick={onCloseMobile}
                        className="absolute right-0 top-2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}

                {business?.logo_url ? (
                    <div className="h-24 w-24 shrink-0 rounded-2xl overflow-hidden bg-gray-50 dark:bg-zinc-800 p-1 shadow-md border border-gray-100 dark:border-zinc-700 mb-4">
                        <Image
                            src={business.logo_url}
                            alt={business.business_name}
                            width={96}
                            height={96}
                            className="h-full w-full rounded-xl object-cover"
                        />
                    </div>
                ) : (
                    <div className="h-24 w-24 shrink-0 rounded-2xl bg-linear-to-br from-brand-primary to-brand-accent flex items-center justify-center text-white font-bold text-4xl shadow-md mb-4">
                        {business?.business_name?.charAt(0) || 'D'}
                    </div>
                )}

                <div className="flex flex-col items-center text-center w-full">
                    <span className="text-xl font-bold text-gray-900 dark:text-white truncate w-full px-2">
                        {business?.business_name || 'FoodFast Pro'}
                    </span>
                    {(() => {
                        const onTrial = isTrialActive(business?.trial_ends_at);
                        const trialDays = getTrialDaysRemaining(business?.trial_ends_at);
                        if (onTrial) {
                            return (
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-1 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                                    🎁 Trial · {trialDays}d
                                </span>
                            );
                        }
                        return (
                            <span className="text-xs font-bold text-brand-primary uppercase tracking-wider mt-1 bg-brand-primary/10 px-3 py-1 rounded-full">
                                {plan === 'professional' ? 'Pro' : plan}
                            </span>
                        );
                    })()}
                </div>
            </div>
            <nav className="flex flex-1 flex-col px-1">
                <ul role="list" className="flex flex-1 flex-col gap-y-1">
                    <li>
                        <ul role="list" className="space-y-1.5">
                            {filteredNavigation.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            onClick={onCloseMobile}
                                            className={classNames(
                                                isActive
                                                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25 ring-1 ring-black/5'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white',
                                                'group flex items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200'
                                            )}
                                        >
                                            <item.icon
                                                className={classNames(
                                                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300',
                                                    'h-5 w-5 shrink-0 transition-colors'
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
                            className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 group flex items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-medium w-full transition-all duration-200"
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
