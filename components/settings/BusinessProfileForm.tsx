"use client";

import { useState } from "react";
import { Businessman, OperatingScheduleItem } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { updateBusinessProfile } from "@/lib/actions/settings";
import { Camera, Loader2, Save, Clock, Check, X } from "lucide-react";
import Image from "next/image";

interface BusinessProfileFormProps {
    businessman: Businessman;
}

const DEFAULT_SCHEDULE: OperatingScheduleItem[] = [
    { day: 'monday', label: 'Lunes', open: '08:00', close: '20:00', isActive: true },
    { day: 'tuesday', label: 'Martes', open: '08:00', close: '20:00', isActive: true },
    { day: 'wednesday', label: 'Miércoles', open: '08:00', close: '20:00', isActive: true },
    { day: 'thursday', label: 'Jueves', open: '08:00', close: '20:00', isActive: true },
    { day: 'friday', label: 'Viernes', open: '08:00', close: '20:00', isActive: true },
    { day: 'saturday', label: 'Sábado', open: '09:00', close: '22:00', isActive: true },
    { day: 'sunday', label: 'Domingo', open: '09:00', close: '21:00', isActive: true },
];

export default function BusinessProfileForm({ businessman }: BusinessProfileFormProps) {
    const [formData, setFormData] = useState<Partial<Businessman>>({
        business_name: businessman.business_name,
        description: businessman.description || "",
        phone: businessman.phone || "",
        whatsapp_number: businessman.whatsapp_number,
        address: businessman.address || "",
        operating_schedule: businessman.operating_schedule?.length ? businessman.operating_schedule : DEFAULT_SCHEDULE
    });

    // Helper to update a specific day in the schedule
    const updateScheduleDay = (index: number, field: keyof OperatingScheduleItem, value: any) => {
        const currentSchedule = formData.operating_schedule || DEFAULT_SCHEDULE;
        const newSchedule = [...currentSchedule];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        setFormData({ ...formData, operating_schedule: newSchedule });
    };

    const [logoUrl, setLogoUrl] = useState<string | null>(businessman.logo_url || null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const supabase = createClient();

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            setMessage(null);

            if (!e.target.files || e.target.files.length === 0) {
                return;
            }

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${businessman.id}/logo-${Date.now()}.${fileExt}`;
            const filePath = `business-logos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);

            setLogoUrl(publicUrl);
            await updateBusinessProfile(businessman.id, { logo_url: publicUrl });

        } catch (error) {
            console.error("Error uploading logo:", error);
            setMessage({ type: 'error', text: "Error al subir la imagen" });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        const result = await updateBusinessProfile(businessman.id, formData);

        if (result.success) {
            setMessage({ type: 'success', text: "Perfil actualizado correctamente" });
        } else {
            setMessage({ type: 'error', text: "Error al guardar los cambios" });
        }
        setSaving(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Header / Logo Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
                        {logoUrl ? (
                            <Image
                                src={logoUrl}
                                alt="Logo"
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-2xl font-bold text-gray-400">
                                {formData.business_name?.charAt(0) || "B"}
                            </span>
                        )}
                        {uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            </div>
                        )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 rounded-full text-white cursor-pointer hover:bg-indigo-700 transition-colors shadow-sm">
                        <Camera className="w-4 h-4" />
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                </div>

                <div className="text-center sm:text-left flex-1">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Información del Negocio</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Actualiza la identidad, datos de contacto y horarios de tu negocio.
                    </p>
                </div>
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Negocio</label>
                    <input
                        type="text"
                        value={formData.business_name}
                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-700 dark:text-white px-4 py-2.5 transition-shadow"
                        required
                    />
                </div>

                <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp (Pedidos)</label>
                    <input
                        type="tel"
                        value={formData.whatsapp_number}
                        onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-700 dark:text-white px-4 py-2.5 transition-shadow"
                        required
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                    <textarea
                        rows={3}
                        value={formData.description || ""}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-700 dark:text-white px-4 py-2.5 transition-shadow"
                        placeholder="Breve descripción de tu negocio..."
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
                    <input
                        type="text"
                        value={formData.address || ""}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-700 dark:text-white px-4 py-2.5 transition-shadow"
                    />
                </div>

                {/* Operating Schedule Section */}
                <div className="col-span-2 border-t border-gray-200 dark:border-gray-700 pt-6 mt-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-indigo-500" />
                        Horarios de Atención Semanal
                    </h3>

                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {(formData.operating_schedule || DEFAULT_SCHEDULE).map((item, index) => (
                            <div
                                key={item.day}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 last:border-0 gap-4 transition-colors ${!item.isActive ? 'opacity-60 bg-gray-100/50 dark:bg-zinc-900/50' : 'bg-white dark:bg-zinc-800'
                                    }`}
                            >
                                <div className="flex items-center gap-3 min-w-[140px]">
                                    <button
                                        type="button"
                                        onClick={() => updateScheduleDay(index, 'isActive', !item.isActive)}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${item.isActive ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-zinc-600'
                                            }`}
                                    >
                                        <span className="sr-only">Use setting</span>
                                        <span
                                            aria-hidden="true"
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${item.isActive ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                        />
                                    </button>
                                    <span className={`font-medium ${item.isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {item.label}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 flex-1">
                                    <div className="flex-1">
                                        <label className="sr-only">Apertura</label>
                                        <input
                                            type="time"
                                            value={item.open}
                                            disabled={!item.isActive}
                                            onChange={(e) => updateScheduleDay(index, 'open', e.target.value)}
                                            className="block w-full rounded-md border-gray-300 dark:border-zinc-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-700 dark:text-white px-3 py-2 disabled:bg-gray-100 dark:disabled:bg-zinc-800 disabled:text-gray-400"
                                        />
                                    </div>
                                    <span className="text-gray-400">-</span>
                                    <div className="flex-1">
                                        <label className="sr-only">Cierre</label>
                                        <input
                                            type="time"
                                            value={item.close}
                                            disabled={!item.isActive}
                                            onChange={(e) => updateScheduleDay(index, 'close', e.target.value)}
                                            className="block w-full rounded-md border-gray-300 dark:border-zinc-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-700 dark:text-white px-3 py-2 disabled:bg-gray-100 dark:disabled:bg-zinc-800 disabled:text-gray-400"
                                        />
                                    </div>
                                </div>
                                <div className="w-[80px] text-right text-xs font-medium text-gray-500 dark:text-gray-400 hidden sm:block">
                                    {item.isActive ? <span className="text-green-600 dark:text-green-400">Abierto</span> : "Cerrado"}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-between">
                <div>
                    {message && (
                        <span className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {message.text}
                        </span>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Guardar Cambios
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
