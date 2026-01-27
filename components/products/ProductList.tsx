"use client";

import { useState, useTransition, useOptimistic, useEffect } from "react";
import { Category, Product } from "@/lib/types/base-types";
import { deleteProduct, toggleProductStatus } from "@/lib/actions/products";
import { Edit2, Plus, Trash2, Search, Power, PowerOff, ImageOff } from "lucide-react";
import Image from "next/image";
import ProductModal from "./ProductModal";
import ProductForm from "./ProductForm";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface ProductListProps {
    initialProducts: Product[];
    categories: Category[];
    businessmanId: string;
}

export default function ProductList({ initialProducts, categories, businessmanId }: ProductListProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [products, setProducts] = useState(initialProducts);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    // Optimistic State
    const [optimisticProducts, addOptimisticProduct] = useOptimistic(
        products,
        (state: Product[], updatedProduct: Product) => {
            return state.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
        }
    );

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

    // Sync initialProducts with local state
    useEffect(() => {
        setProducts(initialProducts);
    }, [initialProducts]);

    const filteredProducts = optimisticProducts.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleDelete = async (id: string) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.")) {
            return;
        }

        startTransition(async () => {
            const result = await deleteProduct(id);
            if (result.success) {
                router.refresh();
            } else {
                alert("Error al eliminar el producto");
            }
        });
    };

    const handleToggleStatus = async (product: Product) => {
        startTransition(async () => {
            // Optimistic Update
            addOptimisticProduct({
                ...product,
                is_available: !product.is_available
            });

            const result = await toggleProductStatus(product.id, product.is_available);
            if (result.success) {
                router.refresh();
            } else {
                // If it fails, the optimistic update will be reverted automatically 
                // when the router refreshes (or we could revert manually but refresh is safer)
                alert("Error al actualizar el estado");
                router.refresh();
            }
        });
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
    };

    const closeEditModal = () => {
        setEditingProduct(undefined);
    };

    const handleSuccess = () => {
        setIsAddModalOpen(false);
        setEditingProduct(undefined);
        router.refresh();
    };

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center"
            >
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar productos..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <select
                        className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="all">Todas las categorías</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white rounded-xl hover:bg-brand-primary-hover transition-all shadow-sm whitespace-nowrap font-medium"
                    >
                        <Plus className="h-4 w-4" />
                        Agregar Producto
                    </button>
                </div>
            </motion.div>

            {/* Products Grid/Table */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-zinc-800/50 text-gray-500 dark:text-gray-400 font-medium">
                            <tr>
                                <th className="px-6 py-4">Producto</th>
                                <th className="px-6 py-4">Categoría</th>
                                <th className="px-6 py-4">Precio</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            <AnimatePresence>
                                {filteredProducts.length === 0 ? (
                                    <motion.tr
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            No se encontraron productos con esos criterios.
                                        </td>
                                    </motion.tr>
                                ) : (
                                    filteredProducts.map((product) => (
                                        <motion.tr
                                            key={product.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="group hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative h-12 w-12 rounded-lg bg-gray-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                                                        {product.image_url ? (
                                                            <Image
                                                                src={product.image_url}
                                                                alt={product.name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full w-full text-gray-400">
                                                                <ImageOff size={16} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                                                        <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                                            {product.description || "Sin descripción"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                                {product.category?.name || "Sin categoría"}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                ${product.price.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <motion.span
                                                    layout
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${product.is_available
                                                        ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                                                        : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                                                        }`}
                                                >
                                                    {product.is_available ? "Activo" : "Inactivo"}
                                                </motion.span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleToggleStatus(product)}
                                                        className={`p-2 rounded-lg transition-colors ${product.is_available
                                                            ? "text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                                            : "text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                            }`}
                                                        title={product.is_available ? "Desactivar" : "Activar"}
                                                    >
                                                        {product.is_available ? <PowerOff size={18} /> : <Power size={18} />}
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(product)}
                                                        className="p-2 text-brand-primary hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        disabled={isPending}
                                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Add Product Modal */}
            <ProductModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Agregar Nuevo Producto"
            >
                <ProductForm
                    categories={categories}
                    onSuccess={handleSuccess}
                    onCancel={() => setIsAddModalOpen(false)}
                    businessmanId={businessmanId}
                />
            </ProductModal>

            {/* Edit Product Modal */}
            <ProductModal
                isOpen={!!editingProduct}
                onClose={closeEditModal}
                title="Editar Producto"
            >
                {editingProduct && (
                    <ProductForm
                        key={editingProduct.id} // Force re-render on product change
                        product={editingProduct}
                        categories={categories}
                        onSuccess={handleSuccess}
                        onCancel={closeEditModal}
                        businessmanId={businessmanId}
                    />
                )}
            </ProductModal>
        </div>
    );
}
