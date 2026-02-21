
'use client'

import { useState } from 'react'
import { Zap, Menu } from 'lucide-react'
import { Businessman } from '@/lib/types'
import QuickActionsPanel from '@/components/layout/QuickActionsPanel'
import NotificationCenter from './NotificationCenter'
import { ThemeToggle } from './ThemeToggle'
import { SidebarTrigger } from './sidebar'

interface HeaderProps {
    business: Businessman | null
}

export default function Header({ business }: HeaderProps) {
    const [showQuickActions, setShowQuickActions] = useState(false)
    const isSurgeActive = (business?.delivery_surge_multiplier || 1) > 1

    return (
        <>
            <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 bg-background/80 backdrop-blur-xl border-b border-border px-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <SidebarTrigger />
                </div>

                <div className="flex flex-1 items-center justify-end gap-x-3">
                    <ThemeToggle />

                    {/* Quick Actions Trigger */}
                    <button
                        type="button"
                        onClick={() => setShowQuickActions(true)}
                        className={`p-2 rounded-xl transition-all relative ${isSurgeActive
                            ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                            : 'text-muted-foreground hover:bg-accent'
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

                    <div className="h-6 w-px bg-border" aria-hidden="true" />

                    <NotificationCenter businessId={business?.id} planType={business?.plan_type} />
                </div>
            </header>

            <QuickActionsPanel
                isOpen={showQuickActions}
                onClose={() => setShowQuickActions(false)}
                business={business}
            />
        </>
    )
}
