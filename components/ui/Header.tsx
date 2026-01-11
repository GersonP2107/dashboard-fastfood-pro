
'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import { Businessman } from '@/lib/types'
import QuickActionsPanel from '@/components/layout/QuickActionsPanel'
import NotificationCenter from './NotificationCenter'

interface HeaderProps {
    business: Businessman | null
}

export default function Header({ business }: HeaderProps) {
    const [showQuickActions, setShowQuickActions] = useState(false)
    const isSurgeActive = (business?.delivery_surge_multiplier || 1) > 1

    return (
        <>
            <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                    <form className="relative flex flex-1" action="#" method="GET">
                        {/* Placeholder for search */}
                    </form>
                    <div className="flex items-center gap-x-4 lg:gap-x-6">
                        {/* Quick Actions Trigger */}
                        <button
                            type="button"
                            onClick={() => setShowQuickActions(true)}
                            className={`-m-2.5 p-2.5 transition-colors relative ${isSurgeActive
                                ? 'text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300'
                                : 'text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                                }`}
                            title="Acciones Rápidas (Tarifa Dinámica)"
                        >
                            <span className="sr-only">Quick Actions</span>
                            <Zap className={`h-6 w-6 ${isSurgeActive ? 'fill-current' : ''}`} aria-hidden="true" />
                            {isSurgeActive && (
                                <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span>
                                </span>
                            )}
                        </button>

                        <div className="h-6 w-px bg-gray-200 dark:bg-zinc-700" aria-hidden="true" />

                        <NotificationCenter businessId={business?.id} />
                        <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:lg:bg-zinc-700" aria-hidden="true" />
                        <div className="flex items-center gap-x-4 lg:gap-x-6">
                            {/* Profile dropdown placeholder */}
                            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                                {business?.business_name?.charAt(0) || 'D'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <QuickActionsPanel
                isOpen={showQuickActions}
                onClose={() => setShowQuickActions(false)}
                business={business}
            />
        </>
    )
}
