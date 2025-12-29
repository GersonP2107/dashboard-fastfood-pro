"use client";

import { useState } from "react";
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
    const [isAdding, setIsAdding] = useState(false);
    const [newZone, setNewZone] = useState({ zone_name: "", delivery_cost: 0 });
    const [loading, setLoading] = useState(false);

    const handleAdd = async () => {
        if (!newZone.zone_name) return;
        setLoading(true);
        const result = await createDeliveryZone(businessmanId, {
            zone_name: newZone.zone_name,
            delivery_cost: newZone.delivery_cost,
            is_active: true
        });

        if (result.success && result.data) {
            setZones([...zones, result.data as DeliveryZone]);
            setNewZone({ zone_name: "", delivery_cost: 0 });
            setIsAdding(false);
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
                            <div className="flex flex-col sm:flex-row gap-4 items-end">
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Nombre de la Zona</label>
                                    <input
                                        type="text"
                                        value={newZone.zone_name}
                                        onChange={(e) => setNewZone({ ...newZone, zone_name: e.target.value })}
                                        placeholder="Ej. Centro, Norte"
                                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-700 dark:text-white px-4 py-2"
                                    />
                                </div>
                                <div className="w-full sm:w-32">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Costo</label>
                                    <div className="relative rounded-md shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <span className="text-gray-500 sm:text-sm">$</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={newZone.delivery_cost}
                                            onChange={(e) => setNewZone({ ...newZone, delivery_cost: Number(e.target.value) })}
                                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 pl-7 pr-4 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button
                                        onClick={handleAdd}
                                        disabled={loading || !newZone.zone_name}
                                        className="flex-1 sm:flex-none justify-center inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        <Save className="h-4 w-4 mr-1" />
                                        Guardar
                                    </button>
                                    <button
                                        onClick={() => setIsAdding(false)}
                                        className="flex-1 sm:flex-none justify-center inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700"
                                    >
                                        <X className="h-4 w-4 mr-1" />
                                        Cancelar
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
