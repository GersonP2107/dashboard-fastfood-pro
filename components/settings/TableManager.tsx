"use client";

import { useState } from "react";
import { Zone, RestaurantTable } from "@/lib/types";
import { createZone, deleteZone, createTable, deleteTable } from "@/lib/actions/tables";
import { Plus, Trash2, Layout, Table as TableIcon } from "lucide-react";

interface TableManagerProps {
    businessmanId: string;
    initialZones: Zone[];
}

export default function TableManager({ businessmanId, initialZones }: TableManagerProps) {
    const [zones, setZones] = useState<Zone[]>(initialZones);
    const [newZoneName, setNewZoneName] = useState("");
    const [loading, setLoading] = useState(false);

    // State for creating a table
    const [activeZoneIdForTable, setActiveZoneIdForTable] = useState<string | null>(null);
    const [newTableName, setNewTableName] = useState("");
    const [newTableCapacity, setNewTableCapacity] = useState(4);

    const handleCreateZone = async () => {
        if (!newZoneName.trim()) return;
        setLoading(true);
        const result = await createZone(businessmanId, newZoneName);
        if (result.success && result.data) {
            setZones([...zones, { ...result.data, tables: [] }]);
            setNewZoneName("");
        } else {
            alert("Error creating zone");
        }
        setLoading(false);
    };

    const handleDeleteZone = async (id: string) => {
        if (!confirm("Are you sure? This will delete all tables in this zone.")) return;
        setLoading(true);
        const result = await deleteZone(id);
        if (result.success) {
            setZones(zones.filter(z => z.id !== id));
        } else {
            alert("Error deleting zone");
        }
        setLoading(false);
    };

    const handleCreateTable = async (zoneId: string) => {
        if (!newTableName.trim()) return;
        setLoading(true);
        const result = await createTable(businessmanId, zoneId, newTableName, newTableCapacity);
        if (result.success && result.data) {
            setZones(zones.map(z => {
                if (z.id === zoneId) {
                    return {
                        ...z,
                        tables: [...(z.tables || []), result.data]
                    };
                }
                return z;
            }));
            setNewTableName("");
            setActiveZoneIdForTable(null);
        } else {
            alert("Error creating table");
        }
        setLoading(false);
    };

    const handleDeleteTable = async (zoneId: string, tableId: string) => {
        if (!confirm("Delete this table?")) return;
        setLoading(true);
        const result = await deleteTable(tableId);
        if (result.success) {
            setZones(zones.map(z => {
                if (z.id === zoneId) {
                    return {
                        ...z,
                        tables: z.tables?.filter(t => t.id !== tableId)
                    };
                }
                return z;
            }));
        } else {
            alert("Error deleting table");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gestión de Mesas</h2>
                    <p className="text-sm text-gray-500">Configura las zonas y mesas de tu restaurante.</p>
                </div>
            </div>

            {/* Create Zone */}
            <div className="flex gap-4 items-end bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-gray-200 dark:border-zinc-700">
                <div className="flex-1 space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Nueva Zona</label>
                    <input
                        type="text"
                        value={newZoneName}
                        onChange={(e) => setNewZoneName(e.target.value)}
                        placeholder="Ej: Terraza, Salón Principal"
                        className="w-full p-2 rounded-lg border border-gray-300 dark:border-zinc-600 dark:bg-zinc-800"
                    />
                </div>
                <button
                    onClick={handleCreateZone}
                    disabled={loading || !newZoneName.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-bold"
                >
                    Crear Zona
                </button>
            </div>

            {/* Zones List */}
            <div className="space-y-6">
                {zones.map(zone => (
                    <div key={zone.id} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                        {/* Zone Header */}
                        <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-800/80 border-b border-gray-200 dark:border-zinc-700 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Layout className="w-5 h-5 text-indigo-500" />
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{zone.name}</h3>
                                <span className="bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded text-xs">
                                    {zone.tables?.length || 0} mesas
                                </span>
                            </div>
                            <button
                                onClick={() => handleDeleteZone(zone.id)}
                                className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Tables Grid */}
                        <div className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {zone.tables?.map(table => (
                                    <div key={table.id} className="relative group bg-white dark:bg-zinc-800 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
                                        <TableIcon className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 transition-colors" />
                                        <span className="font-bold text-gray-800 dark:text-gray-200">{table.name}</span>
                                        <span className="text-xs text-gray-400">{table.capacity} pax</span>

                                        <button
                                            onClick={() => handleDeleteTable(zone.id, table.id)}
                                            className="absolute -top-2 -right-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}

                                {/* Add Table Button/Form */}
                                {activeZoneIdForTable === zone.id ? (
                                    <div className="col-span-2 bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800 flex flex-col gap-2">
                                        <input
                                            type="text"
                                            value={newTableName}
                                            onChange={(e) => setNewTableName(e.target.value)}
                                            placeholder="Nombre (Mesa 1)"
                                            className="text-sm p-1.5 rounded border dark:bg-zinc-900 dark:border-zinc-700"
                                            autoFocus
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={newTableCapacity}
                                                onChange={(e) => setNewTableCapacity(parseInt(e.target.value))}
                                                placeholder="Cap"
                                                className="w-16 text-sm p-1.5 rounded border dark:bg-zinc-900 dark:border-zinc-700"
                                            />
                                            <button
                                                onClick={() => handleCreateTable(zone.id)}
                                                className="flex-1 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700"
                                            >
                                                Crear
                                            </button>
                                            <button
                                                onClick={() => setActiveZoneIdForTable(null)}
                                                className="px-2 text-gray-500 hover:text-gray-700"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setActiveZoneIdForTable(zone.id);
                                            setNewTableName(`Mesa ${(zone.tables?.length || 0) + 1}`);
                                        }}
                                        className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-xl text-gray-400 hover:text-indigo-500 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all gap-2 h-full min-h-[100px]"
                                    >
                                        <Plus className="w-6 h-6" />
                                        <span className="text-xs font-bold">Agregar Mesa</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {zones.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 dark:bg-zinc-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-800">
                        <Layout className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No hay zonas configuradas</h3>
                        <p className="text-gray-500">Crea tu primera zona (ej. "Salón") para agregar mesas.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function X({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    )
}
