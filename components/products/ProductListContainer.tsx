import { getCategories, getProducts } from "@/lib/actions/products";
import ProductList from "./ProductList";

export default async function ProductListContainer({ businessmanId }: { businessmanId: string }) {
    // Parallel fetching for maximum speed
    const [products, categories] = await Promise.all([
        getProducts(businessmanId),
        getCategories(businessmanId),
    ]);

    return (
        <ProductList
            initialProducts={products}
            categories={categories}
            businessmanId={businessmanId}
        />
    );
}
