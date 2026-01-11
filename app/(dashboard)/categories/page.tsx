import { getCurrentBusinessman } from "@/lib/actions/users";
import { getAllCategories } from "@/lib/actions/categories";
import { redirect } from "next/navigation";
import CategoryManager from "@/components/categories/CategoryManager";

export default async function CategoriesPage() {
    const business = await getCurrentBusinessman();

    if (!business) {
        redirect("/login");
    }

    const categories = await getAllCategories(business.id);

    return (
        <CategoryManager
            categories={categories}
            businessmanId={business.id}
        />
    );
}
