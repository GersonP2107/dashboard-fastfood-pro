
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, ListOrdered, Settings, LogOut, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Productos', href: '/products', icon: ShoppingBag },
    { name: 'Ordenes', href: '/orders', icon: ListOrdered },
    { name: 'Configuración', href: '/settings', icon: Settings },
    { name: 'Inventario', href: '/inventory', icon: Package },
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
}

export default function Sidebar({ business }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
    }

    return (
        <div className="flex h-full w-64 flex-col gap-y-5 overflow-y-auto bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center">
                {business?.logo_url ? (
                    <img src={business.logo_url} alt={business.business_name} className="h-8 w-auto mr-2" />
                ) : null}
                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    {business?.business_name || 'DigitalMenu'}
                </span>
            </div>
            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                        <ul role="list" className="-mx-2 space-y-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={classNames(
                                                isActive
                                                    ? 'bg-gray-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400'
                                                    : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-zinc-800',
                                                'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                            )}
                                        >
                                            <item.icon
                                                className={classNames(
                                                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
                                                    'h-6 w-6 shrink-0'
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
                            className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-zinc-800 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold -mx-2 w-full"
                        >
                            <LogOut
                                className="text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 h-6 w-6 shrink-0"
                                aria-hidden="true"
                            />
                            Sign out
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    )
}
