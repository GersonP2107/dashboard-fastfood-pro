"use client";

import { useState, useEffect } from "react";
import { PaymentMethod } from "@/lib/types";
import { Plus, Trash2, Save, X, CreditCard, Banknote, Smartphone, AlertCircle } from "lucide-react";
import { createPaymentMethod, updatePaymentMethod, deletePaymentMethod } from "@/lib/actions/payment-methods";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface PaymentMethodsManagerProps {
    businessmanId: string;
    initialMethods: PaymentMethod[];
}

const METHOD_TYPES = [
    { value: 'nequi', label: 'Nequi', icon: Smartphone, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
    { value: 'daviplata', label: 'Daviplata', icon: Smartphone, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
    { value: 'bancolombia', label: 'Bancolombia', icon: Banknote, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
    { value: 'efectivo', label: 'Efectivo', icon: Banknote, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
    { value: 'card', label: 'Tarjeta (Datáfono)', icon: CreditCard, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { value: 'other', label: 'Otro', icon: AlertCircle, color: 'text-gray-600 bg-gray-50 dark:bg-gray-800' },
];

export default function PaymentMethodsManager({ businessmanId, initialMethods }: PaymentMethodsManagerProps) {
    const [methods, setMethods] = useState<PaymentMethod[]>(initialMethods);

    useEffect(() => {
        setMethods(initialMethods);
    }, [initialMethods]);

    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);

    // New Method State
    const [newMethod, setNewMethod] = useState<Partial<PaymentMethod>>({
        type: 'nequi',
        name: '',
        account_number: '',
        instructions: '',
        is_active: true
    });

    const handleAdd = async () => {
        if (!newMethod.name) {
            toast.error("El nombre es obligatorio");
            return;
        }

        setLoading(true);
        const result = await createPaymentMethod(businessmanId, newMethod);

        if (result.success && result.data) {
            setMethods([...methods, result.data as PaymentMethod]);
            setNewMethod({ type: 'nequi', name: '', account_number: '', instructions: '', is_active: true });
            setIsAdding(false);
            toast.success("Método de pago agregado");
        } else {
            toast.error(`Error: ${result.error}`);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este método de pago?")) return;
        const result = await deletePaymentMethod(id);
        if (result.success) {
            setMethods(methods.filter(m => m.id !== id));
            toast.success("Método eliminado");
        } else {
            toast.error("Error al eliminar");
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        // Optimistic update
        setMethods(methods.map(m => m.id === id ? { ...m, is_active: !currentStatus } : m));

        const result = await updatePaymentMethod(id, { is_active: !currentStatus });
        if (!result.success) {
            // Revert
            setMethods(methods.map(m => m.id === id ? { ...m, is_active: currentStatus } : m));
            toast.error("Error al actualizar estado");
        }
    };

    const getIcon = (type: string) => {
        const found = METHOD_TYPES.find(t => t.value === type);
        const Icon = found?.icon || AlertCircle;
        return <Icon className={`h-5 w-5 ${found?.color.split(' ')[0]}`} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Métodos de Pago</h2>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    disabled={isAdding}
                    className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 disabled:opacity-50"
                >
                    <Plus className="h-4 w-4" />
                    Nuevo Método
                </button>
            </div>

            <div className="space-y-3">
                <AnimatePresence>
                    {isAdding && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 overflow-hidden mb-4"
                        >
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tipo</label>
                                        <select
                                            value={newMethod.type}
                                            onChange={(e) => setNewMethod({ ...newMethod, type: e.target.value as any })}
                                            className="block w-full rounded-md border-gray-300 dark:border-zinc-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-zinc-950 dark:text-gray-100 px-3 py-2"
                                        >
                                            {METHOD_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nombre para mostrar</label>
                                        <input
                                            type="text"
                                            value={newMethod.name}
                                            onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                                            placeholder="Ej. Nequi - Juan"
                                            className="block w-full rounded-md border-gray-300 dark:border-zinc-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-zinc-950 dark:text-gray-100 px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Número de Cuenta / Celular</label>
                                        <input
                                            type="text"
                                            value={newMethod.account_number}
                                            onChange={(e) => setNewMethod({ ...newMethod, account_number: e.target.value })}
                                            placeholder="Ej. 3001234567"
                                            className="block w-full rounded-md border-gray-300 dark:border-zinc-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-zinc-950 dark:text-gray-100 px-3 py-2"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Instrucciones para el cliente</label>
                                    <textarea
                                        value={newMethod.instructions}
                                        onChange={(e) => setNewMethod({ ...newMethod, instructions: e.target.value })}
                                        placeholder="Ej. Envía el comprobante a este chat..."
                                        rows={2}
                                        className="block w-full rounded-md border-gray-300 dark:border-zinc-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-zinc-950 dark:text-gray-100 px-3 py-2"
                                    />
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
                                        disabled={loading || !newMethod.name}
                                        className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center"
                                    >
                                        <Save className="h-4 w-4 mr-1.5" />
                                        Guardar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {methods.map((method) => (
                        <motion.div
                            key={method.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm border flex flex-col sm:flex-row items-center justify-between gap-4 ${method.is_active ? 'border-gray-100 dark:border-gray-800' : 'border-gray-100 dark:border-gray-800 opacity-60'
                                }`}
                        >
                            <div className="flex items-start gap-4 w-full">
                                <div className={`p-2 rounded-lg ${METHOD_TYPES.find(t => t.value === method.type)?.color || 'bg-gray-100'}`}>
                                    {getIcon(method.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{method.name}</h4>
                                        {!method.is_active && (
                                            <span className="text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 dark:border-zinc-700">
                                                Inactivo
                                            </span>
                                        )}
                                    </div>
                                    {method.account_number && (
                                        <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5">
                                            {method.account_number}
                                        </p>
                                    )}
                                    {method.instructions && (
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-1 italic">
                                            "{method.instructions}"
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                                <button
                                    onClick={() => handleToggleActive(method.id, method.is_active)}
                                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors border ${method.is_active
                                        ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                                        : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-zinc-800 dark:text-gray-400 dark:border-zinc-700"
                                        }`}
                                >
                                    {method.is_active ? "Activo" : "Activar"}
                                </button>

                                <button
                                    onClick={() => handleDelete(method.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}

                    {methods.length === 0 && !isAdding && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl">
                            <Banknote className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No has configurado métodos de pago.</p>
                            <p className="text-xs mt-1">Tus clientes solo tendrán la opción "Acordar con vendedor".</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
