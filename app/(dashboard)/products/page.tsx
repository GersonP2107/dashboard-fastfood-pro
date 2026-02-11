import { getCurrentBusinessman } from "@/lib/actions/users";
import ProductListContainer from "@/components/products/ProductListContainer";
import ProductListSkeleton from "@/components/skeletons/ProductListSkeleton";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function ProductsPage() {
    const business = await getCurrentBusinessman();

    if (!business) {
        redirect("/login");
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Productos</h1>
                <p className="mt-1 text-gray-500 dark:text-gray-400">
                    Administra tu menú, precios y disponibilidad
                </p>
            </div>

            <Suspense fallback={<ProductListSkeleton />}>
                <ProductListContainer businessmanId={business.id} />
            </Suspense>
        </div>
    );
}
