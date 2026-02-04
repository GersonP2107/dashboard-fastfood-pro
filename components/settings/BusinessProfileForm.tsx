import { useState, useEffect } from "react";
import { Businessman, OperatingScheduleItem } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { updateBusinessProfile } from "@/lib/actions/settings";
import { colombiaLocations } from "@/lib/data/colombia";
import { Camera, Loader2, Save, Clock, Check, X, Phone } from "lucide-react";
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

const COUNTRY_CODES = [
    { code: '57', label: '🇨🇴 +57', country: 'CO' },
    { code: '1', label: '🇺🇸 +1', country: 'US' },
    { code: '52', label: '🇲🇽 +52', country: 'MX' },
    { code: '34', label: '🇪🇸 +34', country: 'ES' },
    { code: '54', label: '🇦🇷 +54', country: 'AR' },
    { code: '56', label: '🇨🇱 +56', country: 'CL' },
    { code: '51', label: '🇵🇪 +51', country: 'PE' },
];

export default function BusinessProfileForm({ businessman }: BusinessProfileFormProps) {
    const [formData, setFormData] = useState<Partial<Businessman>>({
        business_name: businessman.business_name,
        description: businessman.description || "",
        phone: businessman.phone || "",
        whatsapp_number: businessman.whatsapp_number,
        address: businessman.address || "",
        department: businessman.department || "",
        city: businessman.city || "",
        operating_schedule: businessman.operating_schedule?.length ? businessman.operating_schedule : DEFAULT_SCHEDULE,
        delivery_time_estimate: businessman.delivery_time_estimate || "30 - 45 min"
    });

    // Parse initial phone prefix
    const [phonePrefix, setPhonePrefix] = useState('57');
    const [phoneNumberOnly, setPhoneNumberOnly] = useState('');

    useEffect(() => {
        if (businessman.whatsapp_number) {
            // Try to find a matching prefix
            const match = COUNTRY_CODES.find(c => businessman.whatsapp_number.startsWith(c.code));
            if (match) {
                setPhonePrefix(match.code);
                setPhoneNumberOnly(businessman.whatsapp_number.slice(match.code.length));
            } else {
                setPhoneNumberOnly(businessman.whatsapp_number);
            }
        }
    }, [businessman.whatsapp_number]);

    // Update formData when prefix or number changes
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            whatsapp_number: `${phonePrefix}${phoneNumberOnly}`
        }));
    }, [phonePrefix, phoneNumberOnly]);

    const availableCities = formData.department
        ? colombiaLocations.find(d => d.department === formData.department)?.cities || []
        : [];

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
                    <label className="absolute bottom-0 right-0 p-1.5 bg-brand-primary rounded-full text-white cursor-pointer hover:bg-brand-primary-hover transition-colors shadow-sm">
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
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm bg-gray-50 dark:bg-zinc-700 dark:text-white px-4 py-2.5 transition-shadow"
                        required
                    />
                </div>

                <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp (Pedidos)</label>
                    <div className="flex rounded-md shadow-sm">
                        <div className="relative flex items-stretch grow focus-within:z-10">
                            <select
                                value={phonePrefix}
                                onChange={(e) => setPhonePrefix(e.target.value)}
                                className="block w-[110px] rounded-l-md border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-zinc-800 text-gray-500 dark:text-gray-300 sm:text-sm focus:border-brand-primary focus:ring-brand-primary border-r-0"
                            >
                                {COUNTRY_CODES.map((c) => (
                                    <option key={c.code} value={c.code}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <input
                            type="tel"
                            value={phoneNumberOnly}
                            onChange={(e) => setPhoneNumberOnly(e.target.value.replace(/\D/g, ''))} // Only allow numbers
                            className="block w-full rounded-none rounded-r-md border-gray-300 dark:border-gray-600 focus:border-brand-primary focus:ring-brand-primary sm:text-sm bg-gray-50 dark:bg-zinc-700 dark:text-white px-4 py-2.5"
                            placeholder="300 123 4567"
                            required
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Número completo: +{phonePrefix}{phoneNumberOnly}
                    </p>
                </div>

                <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tiempo de Entrega Estimado</label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Clock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            value={formData.delivery_time_estimate}
                            onChange={(e) => setFormData({ ...formData, delivery_time_estimate: e.target.value })}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 pl-10 focus:border-brand-primary focus:ring-brand-primary sm:text-sm bg-gray-50 dark:bg-zinc-700 dark:text-white px-4 py-2.5"
                            placeholder="Ej. 30 - 45 min"
                        />
                    </div>
                </div>

                <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Departamento</label>
                    <select
                        value={formData.department}
                        onChange={(e) => {
                            setFormData({
                                ...formData,
                                department: e.target.value,
                                city: "" // Reset city when department changes
                            });
                        }}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm bg-gray-50 dark:bg-zinc-700 dark:text-white px-4 py-2.5 transition-shadow"
                    >
                        <option value="">Selecciona un departamento</option>
                        {colombiaLocations.map((loc) => (
                            <option key={loc.department} value={loc.department}>
                                {loc.department}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ciudad</label>
                    <select
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        disabled={!formData.department}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm bg-gray-50 dark:bg-zinc-700 dark:text-white px-4 py-2.5 transition-shadow disabled:opacity-50"
                    >
                        <option value="">Selecciona una ciudad</option>
                        {availableCities.map((city) => (
                            <option key={city} value={city}>
                                {city}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
                    <input
                        type="text"
                        value={formData.address || ""}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm bg-gray-50 dark:bg-zinc-700 dark:text-white px-4 py-2.5 transition-shadow"
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                    <textarea
                        rows={3}
                        value={formData.description || ""}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm bg-gray-50 dark:bg-zinc-700 dark:text-white px-4 py-2.5 transition-shadow"
                        placeholder="Breve descripción de tu negocio..."
                    />
                </div>

                {/* Operating Schedule Section */}
                <div className="col-span-2 border-t border-gray-200 dark:border-gray-700 pt-6 mt-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-brand-primary" />
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
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${item.isActive ? 'bg-brand-primary' : 'bg-gray-200 dark:bg-zinc-600'
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
                                            className="block w-full rounded-md border-gray-300 dark:border-zinc-600 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm bg-gray-50 dark:bg-zinc-700 dark:text-white px-3 py-2 disabled:bg-gray-100 dark:disabled:bg-zinc-800 disabled:text-gray-400"
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
                                            className="block w-full rounded-md border-gray-300 dark:border-zinc-600 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm bg-gray-50 dark:bg-zinc-700 dark:text-white px-3 py-2 disabled:bg-gray-100 dark:disabled:bg-zinc-800 disabled:text-gray-400"
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
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50"
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
