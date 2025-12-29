import { getCategories, getCurrentBusinessman, getProducts } from "@/lib/actions/products";
import ProductList from "@/components/products/ProductList";
import { redirect } from "next/navigation";

export default async function ProductsPage() {
    const business = await getCurrentBusinessman();

    if (!business) {
        // Redirect to login or onboarding if no business profile found
        redirect("/login");
    }

    const [products, categories] = await Promise.all([
        getProducts(business.id),
        getCategories(business.id),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Manage your menu items, prices, and availability for {business.business_name}.
                </p>
            </div>

            <ProductList
                initialProducts={products}
                categories={categories}
                businessmanId={business.id}
            />
        </div>
    );
}
