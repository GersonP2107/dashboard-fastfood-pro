
'use client'

import { useState } from 'react'
import { Zap, Menu } from 'lucide-react'
import { Businessman } from '@/lib/types'
import QuickActionsPanel from '@/components/layout/QuickActionsPanel'
import NotificationCenter from './NotificationCenter'
import { ThemeToggle } from './ThemeToggle'
import MobileSidebar from './MobileSidebar'

interface HeaderProps {
    business: Businessman | null
}

export default function Header({ business }: HeaderProps) {
    const [showQuickActions, setShowQuickActions] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const isSurgeActive = (business?.delivery_surge_multiplier || 1) > 1

    return (
        <>
            <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-x-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-zinc-800/50 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all lg:hidden"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <span className="sr-only">Abrir menú</span>
                        <Menu className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>

                <div className="flex items-center gap-x-3">
                    <ThemeToggle />

                    {/* Quick Actions Trigger */}
                    <button
                        type="button"
                        onClick={() => setShowQuickActions(true)}
                        className={`p-2 rounded-xl transition-all relative ${isSurgeActive
                            ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                            }`}
                        title="Acciones Rápidas (Tarifa Dinámica)"
                    >
                        <span className="sr-only">Quick Actions</span>
                        <Zap className={`h-5 w-5 ${isSurgeActive ? 'fill-current' : ''}`} aria-hidden="true" />
                        {isSurgeActive && (
                            <span className="absolute top-1 right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                            </span>
                        )}
                    </button>

                    <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800" aria-hidden="true" />

                    <NotificationCenter businessId={business?.id} planType={business?.plan_type} />

                    <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:lg:bg-zinc-800" aria-hidden="true" />

                    <div className="flex items-center gap-x-3">
                        {/* Profile */}
                        <div className="h-9 w-9 rounded-2xl bg-linear-to-br from-brand-primary to-brand-accent flex items-center justify-center text-white font-bold shadow-sm">
                            {business?.business_name?.charAt(0) || 'D'}
                        </div>
                    </div>
                </div>
            </div>

            <QuickActionsPanel
                isOpen={showQuickActions}
                onClose={() => setShowQuickActions(false)}
                business={business}
            />

            <MobileSidebar
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                business={business}
            />
        </>
    )
}
