'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, CloudRain, Flame, Check } from 'lucide-react'
import { Businessman } from '@/lib/types'
import { updateBusinessProfile } from '@/lib/actions/settings'

interface QuickActionsPanelProps {
    isOpen: boolean
    onClose: () => void
    business: Businessman | null
}

const MULTIPLIER_PRESETS = [
    { value: 1.0, label: 'Normal', icon: Check, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    { value: 1.2, label: 'Lluvia (+20%)', icon: CloudRain, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    { value: 1.3, label: 'Alta Demanda (+30%)', icon: Flame, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
]

export default function QuickActionsPanel({ isOpen, onClose, business }: QuickActionsPanelProps) {
    const [multiplier, setMultiplier] = useState(1.0)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (business?.delivery_surge_multiplier) {
            setMultiplier(business.delivery_surge_multiplier)
        }
    }, [business])

    const handleMultiplierChange = async (newValue: number) => {
        if (!business) return
        setMultiplier(newValue)
        setIsSaving(true)

        await updateBusinessProfile(business.id, {
            delivery_surge_multiplier: newValue
        })

        setIsSaving(false)
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-black"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-96 bg-white dark:bg-zinc-900 shadow-xl border-l border-gray-200 dark:border-gray-800"
                    >
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                                    <Zap className="h-5 w-5 text-yellow-500" />
                                    <h3>Acciones Rápidas</h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {/* Surge Pricing Section */}
                                <section>
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                                        Tarifa de Domicilios
                                    </h4>

                                    <div className="space-y-3">
                                        {MULTIPLIER_PRESETS.map((preset) => (
                                            <button
                                                key={preset.value}
                                                onClick={() => handleMultiplierChange(preset.value)}
                                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${multiplier === preset.value
                                                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-600 dark:border-indigo-500'
                                                        : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-300 dark:hover:border-indigo-700'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${preset.color}`}>
                                                        <preset.icon className="h-5 w-5" />
                                                    </div>
                                                    <span className={`font-medium ${multiplier === preset.value
                                                            ? 'text-indigo-900 dark:text-indigo-300'
                                                            : 'text-gray-700 dark:text-gray-300'
                                                        }`}>
                                                        {preset.label}
                                                    </span>
                                                </div>
                                                {multiplier === preset.value && (
                                                    <div className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                                                )}
                                            </button>
                                        ))}

                                        {/* Custom Input */}
                                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                            <label className="block text-xs text-gray-500 mb-2">Multiplicador Personalizado</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0.5"
                                                    max="5.0"
                                                    value={multiplier}
                                                    onChange={(e) => handleMultiplierChange(parseFloat(e.target.value))}
                                                    className="flex-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-800 dark:text-white px-4 py-2"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Explanation */}
                                    <div className="mt-6 bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-4 text-xs text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-zinc-800">
                                        <p className="font-semibold mb-1">Ejemplo de Costo:</p>
                                        <div className="flex justify-between items-center">
                                            <span>Tarifa Base: $5,000</span>
                                            <span className="text-gray-300">→</span>
                                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                                Actual: ${(5000 * multiplier).toLocaleString('es-CO')}
                                            </span>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-zinc-800/20">
                                {isSaving ? (
                                    <span className="text-xs text-indigo-600 flex items-center gap-2 animate-pulse">
                                        <div className="h-2 w-2 bg-indigo-600 rounded-full" />
                                        Guardando cambios...
                                    </span>
                                ) : (
                                    <span className="text-xs text-gray-500 flex items-center gap-2">
                                        <Check className="h-3 w-3 text-green-500" />
                                        Sincronizado
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
