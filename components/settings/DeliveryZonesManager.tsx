"use client";

import { useState, useEffect } from "react";
import { DeliveryZone } from "@/lib/types";
import { MoveRight, Plus, Trash2, Save, X, Zap, Pencil } from "lucide-react";
import { createDeliveryZone, updateDeliveryZone, deleteDeliveryZone } from "@/lib/actions/settings";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface DeliveryZonesManagerProps {
    businessmanId: string;
    initialZones: DeliveryZone[];
    surgeMultiplier?: number;
}

export default function DeliveryZonesManager({ businessmanId, initialZones, surgeMultiplier = 1 }: DeliveryZonesManagerProps) {
    const [zones, setZones] = useState<DeliveryZone[]>(initialZones);

    // Sync state with props when parent fetches data
    useEffect(() => {
        setZones(initialZones);
    }, [initialZones]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newZone, setNewZone] = useState({ zone_name: "", delivery_cost: 0 });
    const [loading, setLoading] = useState(false);

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, title: "", message: "", onConfirm: () => { } });

    const handleSave = async () => {
        if (!newZone.zone_name) return;
        setLoading(true);

        if (editingId) {
            // Update existing zone
            // We use updateDeliveryZone but we need to pass only the fields we want to update
            const result = await updateDeliveryZone(editingId, {
                zone_name: newZone.zone_name,
                delivery_cost: newZone.delivery_cost
            });

            if (result.success && result.data) {
                setZones(zones.map(z => z.id === editingId ? (result.data as DeliveryZone) : z));
                setIsAdding(false);
                setNewZone({ zone_name: "", delivery_cost: 0 });
                setEditingId(null);
            } else {
                alert(`Error al actualizar la zona: ${result.error || 'Desconocido'}`);
            }
        } else {
            // Create new zone
            const result = await createDeliveryZone(businessmanId, {
                zone_name: newZone.zone_name,
                delivery_cost: newZone.delivery_cost,
                is_active: true
            });

            if (result.success && result.data) {
                setZones([...zones, result.data as DeliveryZone]);
                setNewZone({ zone_name: "", delivery_cost: 0 });
                setIsAdding(false);
            } else {
                alert(`Error al guardar la zona: ${result.error || 'Desconocido'}`);
            }
        }
        setLoading(false);
    };

    const handleEdit = (zone: DeliveryZone) => {
        setNewZone({
            zone_name: zone.zone_name,
            delivery_cost: zone.delivery_cost
        });
        setEditingId(zone.id);
        setIsAdding(true);
        // Scroll to top to see the form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setNewZone({ zone_name: "", delivery_cost: 0 });
        setEditingId(null);
        setIsAdding(false);
    };

    const handleDelete = async (id: string, zoneName: string) => {
        setConfirmDialog({
            isOpen: true,
            title: "¿Eliminar zona de domicilio?",
            message: `¿Estás seguro de eliminar la zona "${zoneName}"? Los clientes ya no podrán seleccionar esta zona para entregas.`,
            onConfirm: async () => {
                const result = await deleteDeliveryZone(id);
                if (result.success) {
                    setZones(zones.filter(z => z.id !== id));
                }
            }
        });
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
                    onClick={() => {
                        resetForm();
                        setIsAdding(true);
                    }}
                    disabled={isAdding && !editingId}
                    className="flex items-center gap-2 text-sm text-brand-primary dark:text-brand-light hover:text-brand-primary-hover disabled:opacity-50"
                >
                    <Plus className="h-4 w-4" />
                    Nueva Zona
                </button>
            </div>

            <div className="space-y-3">
                {surgeMultiplier > 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-3 flex items-start gap-3"
                    >
                        <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                Tarifa Dinámica Activa (x{surgeMultiplier})
                            </p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300/80 mt-1">
                                Los costos de domicilio se están multiplicando por {surgeMultiplier}.
                                El cliente verá el precio final ajustado.
                            </p>
                        </div>
                    </motion.div>
                )}

                <AnimatePresence>
                    {isAdding && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 overflow-hidden"
                        >
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100 dark:border-zinc-700">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {editingId ? 'Editar Zona de Domicilio' : 'Nueva Zona de Domicilio'}
                                    </h3>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nombre de la Zona</label>
                                        <input
                                            type="text"
                                            value={newZone.zone_name}
                                            onChange={(e) => setNewZone({ ...newZone, zone_name: e.target.value })}
                                            placeholder="Ej. Centro, Norte"
                                            className="block w-full rounded-md border-gray-300 dark:border-zinc-700 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm bg-gray-50 dark:bg-zinc-950 dark:text-gray-100 placeholder-gray-400 dark:placeholder-zinc-600 px-4 py-2.5 transition-colors"
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
                                                className="block w-full rounded-md border-gray-300 dark:border-zinc-700 pl-7 pr-4 py-2.5 focus:border-brand-primary focus:ring-brand-primary sm:text-sm bg-gray-50 dark:bg-zinc-950 dark:text-gray-100 placeholder-gray-400 dark:placeholder-zinc-600 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        onClick={resetForm}
                                        className="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors flex items-center"
                                    >
                                        <X className="h-4 w-4 mr-1.5" />
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={loading || !newZone.zone_name}
                                        className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50 transition-colors flex items-center"
                                    >
                                        <Save className="h-4 w-4 mr-1.5" />
                                        {editingId ? 'Actualizar' : 'Guardar'}
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
                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                        Costo base: <span className="font-medium">${zone.delivery_cost.toLocaleString()}</span>
                                        {surgeMultiplier > 1 && (
                                            <>
                                                <span className="text-gray-300 dark:text-gray-600">→</span>
                                                <span className="font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-1.5 rounded">
                                                    ${(zone.delivery_cost * surgeMultiplier).toLocaleString()}
                                                </span>
                                            </>
                                        )}
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

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleEdit(zone)}
                                    className="p-1.5 text-gray-400 hover:text-brand-primary hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>

                                <button
                                    onClick={() => handleDelete(zone.id, zone.zone_name)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}

                    {zones.length === 0 && !isAdding && (
                        <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm italic">
                            No hay zonas de cobertura registradas.
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type="danger"
            />
        </div>
    );
}
