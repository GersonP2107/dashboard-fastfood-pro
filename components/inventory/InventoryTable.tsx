'use client'

import { useState, useMemo } from 'react'
import { Product, Category } from '@/lib/types/base-types'
import { updateProductStock } from '@/lib/actions/products'
import { Search, AlertTriangle, ArrowUpDown, Package } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface InventoryTableProps {
    initialProducts: Product[]
    categories: Category[]
}

export default function InventoryTable({ initialProducts, categories }: InventoryTableProps) {
    const [products, setProducts] = useState(initialProducts)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterLowStock, setFilterLowStock] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string>('all')

    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory
            const matchesLowStock = !filterLowStock || (product.stock_quantity !== null && product.stock_quantity < 5)

            return matchesSearch && matchesCategory && matchesLowStock
        })
    }, [products, searchTerm, selectedCategory, filterLowStock])

    const handleStockUpdate = async (productId: string, newStock: number | null) => {
        // Optimistic Update
        const previousProducts = [...products]
        setProducts(current => current.map(p => {
            if (p.id === productId) {
                return {
                    ...p,
                    stock_quantity: newStock,
                    limited_stock: newStock !== null
                }
            }
            return p
        }))

        try {
            const result = await updateProductStock(productId, newStock)
            if (!result.success) throw new Error(result.error)
            toast.success('Stock actualizado')
        } catch (error) {
            console.error(error)
            setProducts(previousProducts) // Rollback
            toast.error('Error al actualizar stock')
        }
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-zinc-800">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-transparent dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2">
                    <select
                        className="text-sm border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="all">Todas las Categorías</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => setFilterLowStock(!filterLowStock)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors border ${filterLowStock
                            ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700'
                            }`}
                    >
                        <AlertTriangle className="w-4 h-4" />
                        Stock Bajo
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-zinc-800/50 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3">Producto</th>
                                <th className="px-6 py-3">Categoría</th>
                                <th className="px-6 py-3">Precio</th>
                                <th className="px-6 py-3">Stock Actual</th>
                                <th className="px-6 py-3 text-right">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                            <AnimatePresence>
                                {filteredProducts.map((product) => (
                                    <motion.tr
                                        key={product.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                                    >
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {product.name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                            {product.category?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-900 dark:text-white">
                                            ${product.price.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StockInput
                                                initialValue={product.stock_quantity}
                                                onChange={(val) => handleStockUpdate(product.id, val)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${product.is_available
                                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400'
                                                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${product.is_available ? 'bg-green-500' : 'bg-red-500'}`} />
                                                {product.is_available ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {filteredProducts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                        <Package className="w-12 h-12 mb-4 opacity-20" />
                        <p>No se encontraron productos.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// Subcomponent for handling input logic
function StockInput({ initialValue, onChange }: { initialValue: number | null, onChange: (val: number | null) => void }) {
    const [value, setValue] = useState(initialValue?.toString() ?? '')
    const [isFocused, setIsFocused] = useState(false)

    // Sync external changes (if optimistic update is reverted or other updates come in)
    useMemo(() => {
        if (!isFocused) {
            setValue(initialValue?.toString() ?? '')
        }
    }, [initialValue, isFocused])

    const handleBlur = () => {
        setIsFocused(false)
        if (value === '') {
            onChange(null)
            return
        }

        const num = parseInt(value)
        if (!isNaN(num)) {
            onChange(num)
        } else {
            // Revert invalid input
            setValue(initialValue?.toString() ?? '')
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur()
        }
    }

    return (
        <div className="flex items-center gap-2">
            <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="∞"
                className={`
                    w-20 px-3 py-1.5 text-center text-sm font-medium rounded-md border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none
                    ${initialValue !== null && initialValue < 5
                        ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/10'
                        : 'bg-white text-gray-900 border-gray-200 dark:bg-zinc-800 dark:text-white dark:border-zinc-700'}
                `}
            />
            {initialValue !== null && initialValue < 5 && (
                <span className="text-xs text-red-500 font-medium">Bajo!</span>
            )}
        </div>
    )
}
