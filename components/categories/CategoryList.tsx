'use client'

import { Category } from '@/lib/types/base-types'
import { Edit2, Trash2, Power, PowerOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { deleteCategory, toggleCategoryStatus } from '@/lib/actions/categories'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTransition } from 'react'

interface CategoryListProps {
    categories: Category[]
    onEdit: (category: Category) => void
}

export default function CategoryList({ categories, onEdit }: CategoryListProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const handleDelete = async (id: string) => {
        if (!window.confirm("¿Estás seguro de eliminar esta categoría? Si tiene productos, no se podrá eliminar.")) {
            return
        }

        startTransition(async () => {
            const result = await deleteCategory(id)
            if (result.success) {
                toast.success("Categoría eliminada")
            } else {
                toast.error(result.error || "Error al eliminar")
            }
        })
    }

    const handleToggleStatus = async (category: Category) => {
        startTransition(async () => {
            const result = await toggleCategoryStatus(category.id, category.is_active)
            if (result.success) {
                toast.success(category.is_active ? "Categoría desactivada" : "Categoría activada")
            } else {
                toast.error("Error al cambiar estado")
            }
        })
    }

    if (categories.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">No hay categorías creadas aún.</p>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-zinc-800/50 text-gray-500 dark:text-gray-400 font-medium">
                        <tr>
                            <th className="px-6 py-4">Orden</th>
                            <th className="px-6 py-4">Nombre</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        <AnimatePresence>
                            {categories.map((cat) => (
                                <motion.tr
                                    key={cat.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="group hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                                >
                                    <td className="px-6 py-4 text-gray-500">
                                        #{cat.order}
                                    </td>

                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        {cat.name}
                                        {cat.description && (
                                            <p className="text-xs text-gray-500 truncate max-w-[200px] font-normal">
                                                {cat.description}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cat.is_active
                                            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                                            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                                            }`}>
                                            {cat.is_active ? "Activa" : "Inactiva"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleToggleStatus(cat)}
                                                className={`p-2 rounded-lg transition-colors ${cat.is_active
                                                    ? "text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                                    : "text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                    }`}
                                                title={cat.is_active ? "Desactivar" : "Activar"}
                                                disabled={isPending}
                                            >
                                                {cat.is_active ? <PowerOff size={18} /> : <Power size={18} />}
                                            </button>
                                            <button
                                                onClick={() => onEdit(cat)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                title="Editar"
                                                disabled={isPending}
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Eliminar"
                                                disabled={isPending}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </div>
    )
}
