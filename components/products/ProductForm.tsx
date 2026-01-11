"use client";

import { useState } from "react";
import { Category, Product, ProductModifier, Modifier } from "@/lib/types/base-types";
import { createProduct, updateProduct } from "@/lib/actions/products";
import { addProductModifier, toggleProductModifierRequired } from "@/lib/actions/modifiers";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import ProductModifiersManager from "./ProductModifiersManager";

interface ProductFormProps {
    categories: Category[];
    product?: Product;
    onSuccess: () => void;
    onCancel: () => void;
    businessmanId: string;
}

export default function ProductForm({ categories, product, onSuccess, onCancel, businessmanId }: ProductFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(product?.image_url || null);
    const [uploading, setUploading] = useState(false);

    // State for new product modifiers (local only until save)
    const [pendingModifiers, setPendingModifiers] = useState<Array<Pick<ProductModifier, 'id' | 'is_required'> & { modifier: Modifier }>>([]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        formData.append("businessman_id", businessmanId);

        // Checkbox handling
        const isAvailable = formData.get("is_available") === "on";
        formData.set("is_available", String(isAvailable));

        if (previewUrl) {
            formData.set("image_url", previewUrl);
        }

        try {
            let result;
            if (product) {
                result = await updateProduct(product.id, formData);
            } else {
                result = await createProduct(formData);
            }

            if (result.error) {
                setError(result.error);
            } else {
                // If creating, handle pending modifiers
                if (!product && (result as any).product && pendingModifiers.length > 0) {
                    const newProductId = (result as any).product.id;

                    // Process modifiers sequentially (could be parallelized)
                    for (const pm of pendingModifiers) {
                        const linkRes = await addProductModifier(newProductId, pm.modifier.id);
                        if (linkRes.success && linkRes.productModifier && pm.is_required) {
                            await toggleProductModifierRequired(linkRes.productModifier.id, true);
                        }
                    }
                }

                onSuccess();
            }
        } catch (err) {
            console.error(err);
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            setError(null);

            if (!e.target.files || e.target.files.length === 0) {
                return;
            }

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${businessmanId}/${fileName}`;

            const supabase = createClient();
            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);

            setPreviewUrl(data.publicUrl);
        } catch (error: any) {
            console.error('Error uploading image:', error);
            setError(error.message || 'Error al subir la imagen');
        } finally {
            setUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                    {error}
                </div>
            )}

            {/* Image Upload */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Imagen del Producto
                </label>
                <div className="flex items-center gap-4">
                    <div className="relative h-24 w-24 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-zinc-800">
                        {previewUrl ? (
                            <>
                                <Image
                                    src={previewUrl}
                                    alt="Vista previa"
                                    fill
                                    className="object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => setPreviewUrl(null)}
                                    className="absolute top-1 right-1 bg-red-500 rounded-full p-1 text-white hover:bg-red-600 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </>
                        ) : (
                            <Upload className="h-8 w-8 text-gray-400" />
                        )}
                        {uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-white" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100 dark:file:bg-indigo-900 dark:file:text-indigo-300"
                        />
                        <p className="mt-1 text-xs text-gray-500">PNG, JPG hasta 10MB</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nombre
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        defaultValue={product?.name}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Hamburguesa Deluxe"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Precio
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                            type="number"
                            id="price"
                            name="price"
                            required
                            step="0.01"
                            min="0"
                            defaultValue={product?.price}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="0.00"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Categoría
                </label>
                <select
                    id="category_id"
                    name="category_id"
                    defaultValue={product?.category_id || ""}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">Selecciona una categoría</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Descripción
                </label>
                <textarea
                    id="description"
                    name="description"
                    rows={3}
                    defaultValue={product?.description || ""}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Descripción detallada del producto..."
                />
            </div>

            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    id="is_available"
                    name="is_available"
                    defaultChecked={product ? product.is_available : true}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="is_available" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Disponible para ordenar
                </label>
            </div>

            <ProductModifiersManager
                productId={product?.id}
                businessmanId={businessmanId}
                initialProductModifiers={product ? (product.product_modifiers || []) : pendingModifiers}
                onModifiersChange={!product ? setPendingModifiers : undefined}
            />

            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-zinc-700"
                    disabled={loading || uploading}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center gap-2"
                    disabled={loading || uploading}
                >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {product ? "Actualizar Producto" : "Crear Producto"}
                </button>
            </div>
        </form>
    );
}
