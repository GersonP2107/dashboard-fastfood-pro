"use client";

import { useState } from "react";
import { Businessman } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { updateBusinessProfile } from "@/lib/actions/settings";
import { Camera, Loader2, Save } from "lucide-react";
import Image from "next/image";

interface BusinessProfileFormProps {
    businessman: Businessman;
}

export default function BusinessProfileForm({ businessman }: BusinessProfileFormProps) {
    const [formData, setFormData] = useState<Partial<Businessman>>({
        business_name: businessman.business_name,
        description: businessman.description || "",
        phone: businessman.phone || "",
        whatsapp_number: businessman.whatsapp_number,
        address: businessman.address || "",
        opening_hours: businessman.opening_hours || "",
        closing_hours: businessman.closing_hours || "",
    });
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
                .from('products') // Storing in 'products' bucket for now as it's public. Ideally 'public-assets'.
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
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
                        Actualiza la identidad y datos de contacto de tu negocio.
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

                <div className="col-span-2 border-t border-gray-200 dark:border-gray-700 pt-6 mt-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Horarios de Atención</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apertura</label>
                            <input
                                type="time"
                                value={formData.opening_hours || ""}
                                onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-700 dark:text-white px-4 py-2.5 transition-shadow"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cierre</label>
                            <input
                                type="time"
                                value={formData.closing_hours || ""}
                                onChange={(e) => setFormData({ ...formData, closing_hours: e.target.value })}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-700 dark:text-white px-4 py-2.5 transition-shadow"
                            />
                        </div>
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
