"use client";

import { useState, useEffect } from "react";
import { DeliveryZone } from "@/lib/types";
import { MoveRight, Plus, Trash2, Save, X } from "lucide-react";
import { createDeliveryZone, updateDeliveryZone, deleteDeliveryZone } from "@/lib/actions/settings";
import { motion, AnimatePresence } from "framer-motion";

interface DeliveryZonesManagerProps {
    businessmanId: string;
    initialZones: DeliveryZone[];
}

export default function DeliveryZonesManager({ businessmanId, initialZones }: DeliveryZonesManagerProps) {
    const [zones, setZones] = useState<DeliveryZone[]>(initialZones);

    // Sync state with props when parent fetches data
    useEffect(() => {
        setZones(initialZones);
    }, [initialZones]);
    const [isAdding, setIsAdding] = useState(false);
    const [newZone, setNewZone] = useState({ zone_name: "", delivery_cost: 0 });
    const [loading, setLoading] = useState(false);

    const handleAdd = async () => {
        if (!newZone.zone_name) return;
        setLoading(true);
        console.log("Attempting to create zone:", newZone, "for business:", businessmanId);

        const result = await createDeliveryZone(businessmanId, {
            zone_name: newZone.zone_name,
            delivery_cost: newZone.delivery_cost,
            is_active: true
        });

        console.log("Create zone result:", result);

        if (result.success && result.data) {
            setZones([...zones, result.data as DeliveryZone]);
            setNewZone({ zone_name: "", delivery_cost: 0 });
            setIsAdding(false);
        } else {
            console.error("Failed to create zone:", result.error);
            alert(`Error al guardar la zona: ${result.error || 'Desconocido'}`);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar esta zona?")) return;
        const result = await deleteDeliveryZone(id);
        if (result.success) {
            setZones(zones.filter(z => z.id !== id));
        }
    };

    const handleUpdate = async (id: string, updates: Partial<DeliveryZone>) => {
        const result = await updateDeliveryZone(id, updates);
        if (result.success && result.data) {
            setZones(zones.map(z => z.id === id ? (result.data as DeliveryZone) : z));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Zonas de Domicilio</h3>
                <button
                    onClick={() => setIsAdding(true)}
                    disabled={isAdding}
                    className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 disabled:opacity-50"
                >
                    <Plus className="h-4 w-4" />
                    Nueva Zona
                </button>
            </div>

            <div className="space-y-3">
                <AnimatePresence>
                    {isAdding && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 overflow-hidden"
                        >
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nombre de la Zona</label>
                                        <input
                                            type="text"
                                            value={newZone.zone_name}
                                            onChange={(e) => setNewZone({ ...newZone, zone_name: e.target.value })}
                                            placeholder="Ej. Centro, Norte"
                                            className="block w-full rounded-md border-gray-300 dark:border-zinc-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-zinc-950 dark:text-gray-100 placeholder-gray-400 dark:placeholder-zinc-600 px-4 py-2.5 transition-colors"
                                        />
                                    </div>
                                    <div className="w-full sm:w-1/3">
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Costo</label>
                                        <div className="relative rounded-md shadow-sm">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                <span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
                                            </div>
                                            <input
                                                type="number"
                                                value={newZone.delivery_cost}
                                                onChange={(e) => setNewZone({ ...newZone, delivery_cost: Number(e.target.value) })}
                                                className="block w-full rounded-md border-gray-300 dark:border-zinc-700 pl-7 pr-4 py-2.5 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-zinc-950 dark:text-gray-100 placeholder-gray-400 dark:placeholder-zinc-600 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        onClick={() => setIsAdding(false)}
                                        className="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors flex items-center"
                                    >
                                        <X className="h-4 w-4 mr-1.5" />
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleAdd}
                                        disabled={loading || !newZone.zone_name}
                                        className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center"
                                    >
                                        <Save className="h-4 w-4 mr-1.5" />
                                        Guardar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {zones.map((zone) => (
                        <motion.div
                            key={zone.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4"
                        >
                            <div className="flex-1 flex items-center gap-4 w-full">
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{zone.zone_name}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Costo: <span className="font-semibold text-gray-700 dark:text-gray-300">${zone.delivery_cost.toLocaleString()}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleUpdate(zone.id, { is_active: !zone.is_active })}
                                        className={`px-2 py-1 text-xs rounded-full font-medium transition-colors ${zone.is_active
                                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                            }`}
                                    >
                                        {zone.is_active ? "Activo" : "Inactivo"}
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => handleDelete(zone.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </motion.div>
                    ))}

                    {zones.length === 0 && !isAdding && (
                        <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm italic">
                            No hay zonas de cobertura registradas.
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
