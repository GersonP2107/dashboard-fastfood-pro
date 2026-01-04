import { Suspense } from 'react'
import { getCurrentBusinessman, getProducts, getCategories } from '@/lib/actions/products'
import InventoryTable from '@/components/inventory/InventoryTable'
import { Package } from 'lucide-react'

export const metadata = {
    title: 'Inventario Rápido | Dashboard',
    description: 'Gestión de stock en tiempo real',
}

export default async function InventoryPage() {
    const business = await getCurrentBusinessman()

    if (!business) {
        return <div>No se encontró el negocio</div>
    }

    const products = await getProducts(business.id)
    const categories = await getCategories(business.id)

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <Package className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventario Rápido</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Gestiona el stock de tus productos de forma ágil.
                    </p>
                </div>
            </div>

            <Suspense fallback={<InventoryLoading />}>
                <InventoryTable initialProducts={products} categories={categories} />
            </Suspense>
        </div>
    )
}

function InventoryLoading() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-14 bg-gray-200 dark:bg-zinc-800 rounded-lg w-full" />
            <div className="h-96 bg-gray-200 dark:bg-zinc-800 rounded-lg w-full" />
        </div>
    )
}
