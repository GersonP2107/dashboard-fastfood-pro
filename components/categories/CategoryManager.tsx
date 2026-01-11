"use client";

import { useState } from "react";
import { Category } from "@/lib/types/base-types";
import { Plus } from "lucide-react";
import CategoryList from "./CategoryList";
import CategoryForm from "./CategoryForm";
import ProductModal from "../products/ProductModal"; // Reusing ProductModal as generic modal

interface CategoryManagerProps {
    categories: Category[];
    businessmanId: string;
}

export default function CategoryManager({ categories, businessmanId }: CategoryManagerProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);

    const handleSuccess = () => {
        setIsAddModalOpen(false);
        setEditingCategory(undefined);
        // Page automatically refreshes via server action revalidatePath
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Categorías</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Administra las categorías de tu menú.
                    </p>
                </div>

                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
                >
                    <Plus className="h-4 w-4" />
                    Nueva Categoría
                </button>
            </div>

            <CategoryList
                categories={categories}
                onEdit={setEditingCategory}
            />

            {/* Create Modal */}
            <ProductModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Nueva Categoría"
            >
                <CategoryForm
                    businessmanId={businessmanId}
                    onSuccess={handleSuccess}
                    onCancel={() => setIsAddModalOpen(false)}
                />
            </ProductModal>

            {/* Edit Modal */}
            <ProductModal
                isOpen={!!editingCategory}
                onClose={() => setEditingCategory(undefined)}
                title="Editar Categoría"
            >
                {editingCategory && (
                    <CategoryForm
                        category={editingCategory}
                        businessmanId={businessmanId}
                        onSuccess={handleSuccess}
                        onCancel={() => setEditingCategory(undefined)}
                    />
                )}
            </ProductModal>
        </div>
    );
}
