"use client";

import { useState, useEffect } from "react";
import { Modifier, ProductModifier } from "@/lib/types/base-types";
import {
    getModifiers,
    createModifier,
    addProductModifier,
    removeProductModifier,
    toggleProductModifierRequired
} from "@/lib/actions/modifiers";
import { Loader2, Plus, Trash2, Check, X, AlertCircle } from "lucide-react";

interface ProductModifiersManagerProps {
    productId?: string;
    businessmanId: string;
    initialProductModifiers: Array<Pick<ProductModifier, 'id' | 'is_required'> & { modifier: Modifier }>;
    onModifiersChange?: (modifiers: Array<Pick<ProductModifier, 'id' | 'is_required'> & { modifier: Modifier }>) => void;
}

export default function ProductModifiersManager({
    productId,
    businessmanId,
    initialProductModifiers,
    onModifiersChange
}: ProductModifiersManagerProps) {
    // Local state for the product's modifiers
    const [productModifiers, setProductModifiers] = useState(initialProductModifiers);

    // Global modifiers library
    const [allModifiers, setAllModifiers] = useState<Modifier[]>([]);
    const [loadingModifiers, setLoadingModifiers] = useState(false);

    // Creating/Adding state
    const [isCreating, setIsCreating] = useState(false); // Toggle "Create New" form
    const [newModifierData, setNewModifierData] = useState({
        name: "",
        additional_price: 0,
        type: 'extra' as const
    });

    // Selection state
    const [selectedModifierId, setSelectedModifierId] = useState("");
    const [processing, setProcessing] = useState(false);

    // Initial fetch of global modifiers
    useEffect(() => {
        loadGlobalModifiers();
    }, [businessmanId]);

    const loadGlobalModifiers = async () => {
        setLoadingModifiers(true);
        const mods = await getModifiers(businessmanId);
        setAllModifiers(mods);
        setLoadingModifiers(false);
    };

    // Actions
    const handleAddExisting = async () => {
        if (!selectedModifierId) return;
        setProcessing(true);

        const modifierToAdd = allModifiers.find(m => m.id === selectedModifierId);
        if (!modifierToAdd) return;

        if (!productId) {
            // Local mode
            const newLocalModifier = {
                id: `temp-${Date.now()}`, // Temporary ID
                is_required: false,
                modifier: modifierToAdd
            };
            const updated = [...productModifiers, newLocalModifier];
            setProductModifiers(updated as any);
            onModifiersChange?.(updated as any);
        } else {
            // Server mode
            const res = await addProductModifier(productId, selectedModifierId);
            if (res.success && res.productModifier) {
                setProductModifiers([...productModifiers, res.productModifier as any]);
            }
        }

        setProcessing(false);
        setSelectedModifierId("");
    };

    const handleCreateAndAdd = async () => {
        setProcessing(true);
        // Create modifier
        const res = await createModifier(businessmanId, {
            ...newModifierData,
            description: null // optional
        });

        if (res.success && res.modifier) {
            // Add to library
            setAllModifiers([...allModifiers, res.modifier]);

            if (!productId) {
                // Local mode
                const newLocalModifier = {
                    id: `temp-${Date.now()}`,
                    is_required: false,
                    modifier: res.modifier
                };
                const updated = [...productModifiers, newLocalModifier];
                setProductModifiers(updated as any);
                onModifiersChange?.(updated as any);
            } else {
                // Link to product
                const resLink = await addProductModifier(productId, res.modifier.id);
                if (resLink.success && resLink.productModifier) {
                    setProductModifiers([...productModifiers, resLink.productModifier as any]);
                }
            }
        }
        setProcessing(false);
        setIsCreating(false);
        setNewModifierData({ name: "", additional_price: 0, type: 'extra' });
    };

    const handleRemove = async (pmId: string) => {
        if (!productId) {
            // Local mode
            const updated = productModifiers.filter(pm => pm.id !== pmId);
            setProductModifiers(updated);
            onModifiersChange?.(updated);
            return;
        }

        // Optimistic remove
        setProductModifiers(prev => prev.filter(pm => pm.id !== pmId));
        await removeProductModifier(pmId);
    };

    const handleToggleRequired = async (pmId: string, current: boolean) => {
        if (!productId) {
            // Local mode
            const updated = productModifiers.map(pm =>
                pm.id === pmId ? { ...pm, is_required: !current } : pm
            );
            setProductModifiers(updated);
            onModifiersChange?.(updated);
            return;
        }

        setProductModifiers(prev => prev.map(pm =>
            pm.id === pmId ? { ...pm, is_required: !current } : pm
        ));
        await toggleProductModifierRequired(pmId, !current);
    };

    // Filter out modifiers already attached
    const attachedIds = new Set(productModifiers.map(pm => pm.modifier.id));
    const availableModifiers = allModifiers.filter(m => !attachedIds.has(m.id));

    return (
        <div className="space-y-4 border-t pt-4 mt-6 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                Modificadores / Extras
            </h3>

            {/* List Attached */}
            <div className="space-y-2">
                {productModifiers.length === 0 && (
                    <p className="text-sm text-gray-500 italic">No hay modificadores vinculados a este producto.</p>
                )}

                {productModifiers.map((pm) => (
                    <div key={pm.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-gray-700 gap-3 sm:gap-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-brand-primary/8 dark:bg-brand-primary/25 p-2 rounded-md shrink-0">
                                <span className="font-bold text-brand-primary dark:text-brand-light text-xs uppercase">{pm.modifier.type}</span>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white mb-0.5">{pm.modifier.name}</p>
                                <p className="text-xs text-gray-500">+ ${pm.modifier.additional_price}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-700">
                            <label className="flex items-center space-x-2 text-sm cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={pm.is_required}
                                    onChange={() => handleToggleRequired(pm.id, pm.is_required)}
                                    className="rounded text-brand-primary focus:ring-brand-primary border-gray-300"
                                />
                                <span className={pm.is_required ? "font-bold text-brand-primary" : "text-gray-500"}>
                                    {pm.is_required ? "Obligatorio" : "Opcional"}
                                </span>
                            </label>

                            <button
                                onClick={() => handleRemove(pm.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                title="Eliminar del producto"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Section */}
            <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                {!isCreating ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                        <select
                            className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            value={selectedModifierId}
                            onChange={(e) => setSelectedModifierId(e.target.value)}
                            disabled={processing || loadingModifiers}
                        >
                            <option value="">Selecciona un modificador existente...</option>
                            {availableModifiers.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.name} (+${m.additional_price})
                                </option>
                            ))}
                        </select>
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddExisting}
                                disabled={!selectedModifierId || processing}
                                className="flex-1 sm:flex-none px-4 py-2 bg-brand-primary text-white rounded-md text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                Agregar
                            </button>
                            <div className="hidden sm:block w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                            >
                                Crear Nuevo
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Nuevo Modificador</span>
                            <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-500 p-1">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Queso Extra"
                                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                    value={newModifierData.name}
                                    onChange={e => setNewModifierData({ ...newModifierData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Precio Adicional</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                        value={newModifierData.additional_price}
                                        onChange={e => setNewModifierData({ ...newModifierData, additional_price: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
                            <select
                                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                value={newModifierData.type}
                                onChange={(e) => setNewModifierData({ ...newModifierData, type: e.target.value as any })}
                            >
                                <option value="extra">Extra (Agregado)</option>
                                <option value="without">Sin (Remover)</option>
                                <option value="option">Opción (Selección)</option>
                            </select>
                        </div>
                        <button
                            onClick={handleCreateAndAdd}
                            disabled={!newModifierData.name || processing}
                            className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                        >
                            {processing ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            Crear y Agregar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
