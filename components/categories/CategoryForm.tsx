'use client'

import { useState } from 'react'
import { Category } from '@/lib/types/base-types'
import { Loader2, Save } from 'lucide-react'
import { createCategory, updateCategory } from '@/lib/actions/categories'
import { toast } from 'sonner'

interface CategoryFormProps {
    category?: Category
    businessmanId: string
    onSuccess: () => void
    onCancel: () => void
}

export default function CategoryForm({ category, businessmanId, onSuccess, onCancel }: CategoryFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const formData = new FormData(e.currentTarget)
            formData.append('businessman_id', businessmanId)

            if (category) {
                const result = await updateCategory(category.id, formData)
                if (result.error) {
                    setError(result.error)
                } else {
                    toast.success('Categoría actualizada correctamente')
                    onSuccess()
                }
            } else {
                const result = await createCategory(formData)
                if (result.error) {
                    setError(result.error as string)
                } else {
                    toast.success('Categoría creada correctamente')
                    onSuccess()
                }
            }
        } catch (err) {
            setError('Ocurrió un error inesperado' + err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nombre
                    </label>
                    <input
                        type="text"
                        name="name"
                        required
                        defaultValue={category?.name}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        placeholder="Ej. Hamburguesas"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="order" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Orden (Prioridad)
                    </label>
                    <input
                        type="number"
                        name="order"
                        defaultValue={category?.order || 0}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Descripción
                </label>
                <textarea
                    name="description"
                    rows={2}
                    defaultValue={category?.description || ""}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="Descripción opcional..."
                />
            </div>

            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    defaultChecked={category ? category.is_active : true}
                    value="true"
                    className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Categoría Activa
                </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-zinc-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-zinc-700"
                    disabled={loading}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-brand-primary/90 disabled:opacity-50 flex items-center gap-2"
                    disabled={loading}
                >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Save size={16} />
                    {category ? "Guardar Cambios" : "Crear Categoría"}
                </button>
            </div>
        </form>
    )
}
