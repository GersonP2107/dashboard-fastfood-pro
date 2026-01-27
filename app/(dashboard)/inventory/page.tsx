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
                <div className="p-2.5 bg-brand-primary/10 rounded-2xl text-brand-primary">
                    <Package className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Inventario Rápido</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Gestiona el stock de tus productos de forma ágil
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
            <div className="h-14 bg-gray-200 dark:bg-zinc-800 rounded-xl w-full" />
            <div className="h-96 bg-gray-200 dark:bg-zinc-800 rounded-3xl w-full" />
        </div>
    )
}
