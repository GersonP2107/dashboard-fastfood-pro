"use client";

import { useState, useTransition, useOptimistic, useEffect } from "react";
import { Category, Product } from "@/lib/types/base-types";
import { deleteProduct, toggleProductStatus } from "@/lib/actions/products";
import { Edit2, Plus, Trash2, Search, Power, PowerOff, ImageOff } from "lucide-react";
import Image from "next/image";
import ProductModal from "./ProductModal";
import ProductForm from "./ProductForm";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";
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


    const [productToDelete, setProductToDelete] = useState<string | null>(null);

    // Sync initialProducts with local state
    useEffect(() => {
        setProducts(initialProducts);
    }, [initialProducts]);

    const filteredProducts = optimisticProducts.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleDelete = (id: string) => {
        setProductToDelete(id);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;

        startTransition(async () => {
            const result = await deleteProduct(productToDelete);
            if (result.success) {
                router.refresh();
                toast.success("Producto eliminado correctamente");
            } else {
                toast.error("Error al eliminar el producto");
            }
            setProductToDelete(null);
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
                toast.error("Error al actualizar el estado");
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


    const handleAddClick = () => {
        if (categories.length === 0) {
            toast.error("Debes crear al menos una categoría antes de agregar productos.", {
                action: {
                    label: "Ir a Categorías",
                    onClick: () => router.push("/categories")
                },
                duration: 5000,
            });
            return;
        }
        setIsAddModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4"
            >
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <select
                            className="w-full sm:w-auto px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all shadow-sm"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="all">Todas las categorías</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>

                        <button
                            onClick={handleAddClick}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl hover:bg-brand-primary-hover transition-all shadow-md shadow-brand-primary/20 font-semibold"
                        >
                            <Plus className="h-5 w-5" />
                            Agregar
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Desktop Table View */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="hidden sm:block bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden"
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
                                                    <div className="relative h-12 w-12 rounded-lg bg-gray-100 dark:bg-zinc-800 overflow-hidden shrink-0">
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
                                                ${product.price ? product.price.toLocaleString() : "0"}
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
                                                            ? "text-brand-primary hover:bg-brand-primary/8 dark:hover:bg-brand-primary/15"
                                                            : "text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                            }`}
                                                        title={product.is_available ? "Desactivar" : "Activar"}
                                                    >
                                                        {product.is_available ? <PowerOff size={18} /> : <Power size={18} />}
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(product)}
                                                        className="p-2 text-brand-primary hover:bg-brand-primary/8 dark:hover:bg-brand-primary/15 rounded-lg transition-colors"
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

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 sm:hidden">
                <AnimatePresence>
                    {filteredProducts.length === 0 ? (
                        <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800">
                            <p className="text-gray-500">No se encontraron productos.</p>
                        </div>
                    ) : (
                        filteredProducts.map((product) => (
                            <motion.div
                                key={product.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col gap-4"
                            >
                                <div className="flex gap-4">
                                    {/* Image */}
                                    <div className="relative h-20 w-20 rounded-xl bg-gray-100 dark:bg-zinc-800 overflow-hidden shrink-0">
                                        {product.image_url ? (
                                            <Image
                                                src={product.image_url}
                                                alt={product.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full w-full text-gray-400">
                                                <ImageOff size={24} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-base truncate pr-2">
                                                {product.name}
                                            </h3>
                                            <span className={`shrink-0 inline-block w-2.5 h-2.5 rounded-full ${product.is_available ? 'bg-green-500' : 'bg-red-500'}`} />
                                        </div>

                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                                            {product.description || "Sin descripción"}
                                        </p>

                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-sm font-medium text-brand-primary">
                                                {product.category?.name || "Sin cat."}
                                            </span>
                                            <span className="font-bold text-gray-900 dark:text-white">
                                                ${product.price ? product.price.toLocaleString() : "0"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-zinc-800">
                                    <button
                                        onClick={() => handleToggleStatus(product)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${product.is_available
                                            ? "bg-brand-primary/8 text-brand-primary dark:bg-brand-primary/15 dark:text-brand-light"
                                            : "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                                            }`}
                                    >
                                        {product.is_available ? (
                                            <>
                                                <PowerOff size={16} />
                                                <span className="sr-only">Desactivar</span>
                                            </>
                                        ) : (
                                            <>
                                                <Power size={16} />
                                                <span className="sr-only">Activar</span>
                                            </>
                                        )}
                                        {product.is_available ? "Desactivar" : "Activar"}
                                    </button>

                                    <button
                                        onClick={() => openEditModal(product)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                                    >
                                        <Edit2 size={16} />
                                        Editar
                                    </button>

                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="p-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

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

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={!!productToDelete}
                onClose={() => setProductToDelete(null)}
                onConfirm={confirmDelete}
                title="Eliminar Producto"
                message="¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                type="danger"
            />
        </div>
    );
}
