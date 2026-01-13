"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    type?: 'danger' | 'warning' | 'info'
}

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Aceptar',
    cancelText = 'Cancelar',
    type = 'danger'
}: ConfirmDialogProps) {
    const handleConfirm = () => {
        onConfirm()
        onClose()
    }

    const typeStyles = {
        danger: {
            icon: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20',
            button: 'bg-red-600 hover:bg-red-700 text-white',
            border: 'border-red-200 dark:border-red-900/50'
        },
        warning: {
            icon: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20',
            button: 'bg-orange-600 hover:bg-orange-700 text-white',
            border: 'border-orange-200 dark:border-orange-900/50'
        },
        info: {
            icon: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20',
            button: 'bg-blue-600 hover:bg-blue-700 text-white',
            border: 'border-blue-200 dark:border-blue-900/50'
        }
    }

    const styles = typeStyles[type]

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Dialog */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.3 }}
                            className={`bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-md w-full border-2 ${styles.border} overflow-hidden`}
                        >
                            {/* Header with Icon */}
                            <div className="p-6 pb-4">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-2xl ${styles.icon} flex-shrink-0`}>
                                        <AlertTriangle className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                            {title}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                            {message}
                                        </p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-6 pb-6 flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm ${styles.button}`}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}
