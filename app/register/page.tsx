"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { registerUser, RegistrationState } from "@/lib/actions/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, Check, Store, Truck, User, Tag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OperatingScheduleItem } from "@/lib/types";
import { colombiaLocations, getCitiesByDepartment } from "@/lib/data/colombia";
import { BUSINESS_CATEGORIES } from "@/lib/data/business-categories";

const steps = [
    { id: 1, title: "Cuenta", icon: User, description: "Crea tu cuenta de admin" },
    { id: 2, title: "Negocio", icon: Store, description: "Información del restaurante" },
    { id: 3, title: "Operación", icon: Truck, description: "Envíos y horarios" },
];

const InputGroup = ({ label, name, type = "text", placeholder, required = true, value, onChange }: any) => (
    <div className="space-y-2">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
        </label>
        <input
            type={type}
            name={name}
            id={name}
            required={required}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className="block w-full rounded-lg border-0 py-3 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 dark:bg-zinc-800 dark:text-white dark:ring-gray-700 sm:text-sm sm:leading-6 transition-all duration-200"
        />
    </div>
);

export default function RegisterPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const router = useRouter();

    const [formValues, setFormValues] = useState({
        fullName: "",
        email: "",
        password: "",
        businessName: "",
        phone: "",
        whatsapp: "",
        department: "",
        city: "",
        address: "",
        neighborhood: "",
        description: "",
        deliveryTime: "30-45",
        businessCategories: [] as string[],

        operatingSchedule: [
            { day: 'monday', label: 'Lunes', open: '09:00', close: '22:00', isActive: true },
            { day: 'tuesday', label: 'Martes', open: '09:00', close: '22:00', isActive: true },
            { day: 'wednesday', label: 'Miércoles', open: '09:00', close: '22:00', isActive: true },
            { day: 'thursday', label: 'Jueves', open: '09:00', close: '22:00', isActive: true },
            { day: 'friday', label: 'Viernes', open: '09:00', close: '23:00', isActive: true },
            { day: 'saturday', label: 'Sábado', open: '09:00', close: '23:00', isActive: true },
            { day: 'sunday', label: 'Domingo', open: '09:00', close: '22:00', isActive: true },
        ] as OperatingScheduleItem[]
    });

    const MAX_CATEGORIES = 5;

    const toggleCategory = (id: string) => {
        setFormValues(prev => {
            const current = prev.businessCategories;
            if (current.includes(id)) {
                return { ...prev, businessCategories: current.filter(c => c !== id) };
            }
            if (current.length >= MAX_CATEGORIES) return prev;
            return { ...prev, businessCategories: [...current, id] };
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormValues((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleScheduleChange = (index: number, field: string, value: any) => {
        setFormValues((prev) => {
            const newSchedule = [...prev.operatingSchedule];
            newSchedule[index] = { ...newSchedule[index], [field]: value };
            return { ...prev, operatingSchedule: newSchedule };
        });
    };

    // Custom server action wrapper to handle redirection on client
    const handleRegister = async (prevState: RegistrationState, formData: FormData) => {
        const fullFormData = new FormData();

        // Append all standard fields
        Object.entries(formValues).forEach(([key, value]) => {
            if (key !== 'operatingSchedule' && key !== 'businessCategories') {
                fullFormData.append(key, value as string);
            }
        });

        // Append schedule as JSON string
        fullFormData.append('operatingSchedule', JSON.stringify(formValues.operatingSchedule));

        // Append business categories as JSON string
        fullFormData.append('businessCategories', JSON.stringify(formValues.businessCategories));

        const result = await registerUser(prevState, fullFormData);
        if (result.success && result.requiresEmailConfirmation) {
            if (result.email) {
                localStorage.setItem('pending_verification_email', result.email)
            }
            toast.success("¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.");
            router.push("/verify-email");
        } else if (result.success) {
            toast.success("¡Registro exitoso!");
            router.push("/");
        } else if (result.error) {
            toast.error(result.error);
        }
        return result;
    };

    const [state, formAction, isPending] = useFormState(handleRegister, {
        success: false,
        error: null,
        requiresEmailConfirmation: false,
        email: '',
    });

    const nextStep = () => {
        let isValid = true;
        let errorMessage = "";

        // Simple validation checks based on current step
        if (currentStep === 1) {
            if (!formValues.fullName || !formValues.email || !formValues.password) {
                isValid = false;
                errorMessage = "Por favor completa todos los campos de la cuenta.";
            }
        } else if (currentStep === 2) {
            if (!formValues.businessName || !formValues.phone || !formValues.city || !formValues.address) {
                isValid = false;
                errorMessage = "Por favor completa todos los campos del negocio.";
            } else if (formValues.businessCategories.length === 0) {
                isValid = false;
                errorMessage = "Selecciona al menos una categoría para tu negocio.";
            }
        }

        if (!isValid) {
            toast.error(errorMessage);
            return;
        }

        setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    };
    const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));



    return (
        <div className="flex h-screen overflow-hidden bg-white dark:bg-black">
            {/* Lado Izquierdo: Visuales */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-zinc-900 border-r border-zinc-800">
                <div className="absolute inset-0 bg-linear-to-br from-orange-600/20 via-purple-600/20 to-blue-600/20 z-0" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2664&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />

                <div className="relative z-10 flex flex-col justify-between p-12 w-full h-full text-white">
                    <div className="space-y-2 shrink-0">
                        <h1 className="text-3xl font-bold bg-linear-to-br from-orange-500 to-red-600 bg-clip-text text-transparent">
                            FoodFast Pro
                        </h1>
                    </div>

                    <div className="space-y-6 max-w-lg">
                        <h2 className="text-6xl font-bold leading-tight">
                            Gestiona tu <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-600">restaurante</span> con facilidad.
                        </h2>
                        <p className="text-lg text-zinc-400">
                            Únete a miles de negocios gastronómicos que optimizan sus entregas, organizan pedidos y mejoran su servicio en un solo lugar.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                        <p>© 2026 FoodFast Pro</p>
                    </div>
                </div>
            </div>

            {/* Lado Derecho: Formulario */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-20 xl:px-24 py-12">
                <div className="mx-auto w-full max-w-md space-y-8">

                    {/* Cabecera */}
                    <div>
                        <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                            Crea tu cuenta
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            ¿Ya tienes una cuenta?{' '}
                            <Link href="/login" className="font-semibold text-orange-600 hover:text-orange-500 transition-colors">
                                Inicia sesión
                            </Link>
                        </p>
                    </div>

                    {/* Contenedor Principal */}
                    <div className="relative mb-8">
                        {/* 1. Líneas de Conexión (Capa Inferior) */}
                        <div className="absolute left-0 top-5 w-full h-0.5 bg-gray-200 dark:bg-zinc-800 -translate-y-1/2" />
                        <div
                            className="absolute left-0 top-5 h-0.5 bg-orange-600 transition-all duration-500 -translate-y-1/2"
                            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                        />

                        {/* 2. Contenedor de Iconos (Capa Superior) */}
                        <div className="relative flex items-center justify-between">
                            {steps.map((step) => {
                                const Icon = step.icon;
                                const isActive = currentStep >= step.id;
                                const isCurrent = currentStep === step.id;

                                return (
                                    <div key={step.id} className="flex flex-col items-center z-10">
                                        {/* El truco: bg-white o bg-black para "tapar" la línea detrás del círculo */}
                                        <div
                                            className={`
                                                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                                    ${isActive
                                                    ? 'bg-orange-600 border-orange-600 text-white'
                                                    : 'bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700 text-gray-400'}
                                                    ${isCurrent ? 'ring-4 ring-orange-100 dark:ring-orange-900/30' : ''}
                                                `}
                                        >
                                            <Icon size={18} />
                                        </div>

                                        {/* Texto descriptivo */}
                                        <span className={`absolute -bottom-6 text-xs font-medium whitespace-nowrap transition-colors ${isCurrent ? 'text-orange-600' : 'text-gray-500'
                                            }`}>
                                            {step.title}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {/* Formulario */}
                    <form action={formAction} className="space-y-6">
                        <AnimatePresence mode="wait">
                            {currentStep === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-5"
                                >
                                    <InputGroup name="fullName" label="Nombre Completo" placeholder="Ej: Juan Pérez" value={formValues.fullName} onChange={handleInputChange} />
                                    <InputGroup name="email" type="email" label="Correo Electrónico" placeholder="juan@ejemplo.com" value={formValues.email} onChange={handleInputChange} />
                                    <InputGroup name="password" type="password" label="Contraseña" placeholder="••••••••" value={formValues.password} onChange={handleInputChange} />
                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            className="w-full flex items-center justify-center rounded-lg bg-orange-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 transition-all"
                                        >
                                            Continuar <ArrowRight size={16} className="ml-2" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-5"
                                >
                                    <InputGroup name="businessName" label="Nombre del Restaurante" placeholder="Ej: Hamburguesas del Rey" value={formValues.businessName} onChange={handleInputChange} />

                                    <InputGroup name="phone" type="tel" label="Teléfono" placeholder="+57 300 123 4567" value={formValues.phone} onChange={handleInputChange} />
                                    <InputGroup name="whatsapp" type="tel" label="WhatsApp" placeholder="+57 300 123 4567" value={formValues.whatsapp} onChange={handleInputChange} />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Departamento
                                            </label>
                                            <select
                                                id="department"
                                                name="department"
                                                required
                                                value={formValues.department}
                                                className="block w-full rounded-lg border-0 py-3 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 dark:bg-zinc-800 dark:text-white dark:ring-gray-700 sm:text-sm sm:leading-6 transition-all duration-200"
                                                onChange={(e) => {
                                                    const dep = e.target.value;
                                                    setFormValues(prev => ({ ...prev, department: dep, city: "" }));
                                                }}
                                            >
                                                <option value="">Selecciona...</option>
                                                {colombiaLocations.map(dep => (
                                                    <option key={dep.department} value={dep.department}>
                                                        {dep.department}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Ciudad
                                            </label>
                                            <select
                                                id="city"
                                                name="city"
                                                required
                                                value={formValues.city}
                                                disabled={!formValues.department}
                                                className="block w-full rounded-lg border-0 py-3 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 dark:bg-zinc-800 dark:text-white dark:ring-gray-700 sm:text-sm sm:leading-6 transition-all duration-200 disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-zinc-900"
                                                onChange={handleInputChange}
                                            >
                                                <option value="">Selecciona...</option>
                                                {getCitiesByDepartment(formValues.department).map(city => (
                                                    <option key={city} value={city}>
                                                        {city}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <InputGroup name="address" label="Dirección" placeholder="Cra 123 # 45-67" value={formValues.address} onChange={handleInputChange} />
                                        <InputGroup name="neighborhood" label="Barrio" placeholder="Ej: El Poblado" value={formValues.neighborhood} onChange={handleInputChange} required={false} />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                                        <textarea
                                            name="description"
                                            rows={3}
                                            value={formValues.description}
                                            onChange={handleInputChange}
                                            className="block w-full rounded-lg border-0 py-3 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 dark:bg-zinc-800 dark:text-white dark:ring-gray-700 sm:text-sm sm:leading-6 transition-all"
                                            placeholder="Las mejores hamburguesas de la ciudad..."
                                        />
                                    </div>

                                    {/* Business Categories */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                <Tag className="w-4 h-4 text-orange-500" />
                                                ¿Qué tipo de comida ofreces?
                                            </label>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${formValues.businessCategories.length >= MAX_CATEGORIES
                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                : 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400'
                                                }`}>
                                                {formValues.businessCategories.length}/{MAX_CATEGORIES}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Selecciona hasta {MAX_CATEGORIES} categorías. Esto ayudará a los clientes a encontrar tu negocio.
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {BUSINESS_CATEGORIES.map((cat) => {
                                                const isSelected = formValues.businessCategories.includes(cat.id);
                                                const isDisabled = !isSelected && formValues.businessCategories.length >= MAX_CATEGORIES;
                                                return (
                                                    <button
                                                        key={cat.id}
                                                        type="button"
                                                        onClick={() => toggleCategory(cat.id)}
                                                        disabled={isDisabled}
                                                        className={`
                                                            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                                                            border transition-all duration-200 select-none
                                                            ${isSelected
                                                                ? 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-600/50 ring-1 ring-orange-200 dark:ring-orange-800'
                                                                : isDisabled
                                                                    ? 'bg-gray-50 text-gray-300 border-gray-100 dark:bg-zinc-900 dark:text-zinc-600 dark:border-zinc-800 cursor-not-allowed opacity-50'
                                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700 dark:hover:border-orange-600/40 dark:hover:bg-orange-900/10 cursor-pointer'
                                                            }
                                                        `}
                                                    >
                                                        <span className="text-base leading-none">{cat.emoji}</span>
                                                        <span>{cat.label}</span>
                                                        {isSelected && (
                                                            <Check className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="flex-1 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-800 px-3 py-3 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all"
                                        >
                                            Atrás
                                        </button>
                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            className="flex-1 flex items-center justify-center rounded-lg bg-orange-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 transition-all"
                                        >
                                            Continuar <ArrowRight size={16} className="ml-2" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-5"
                                >
                                    <div className="space-y-3">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Horarios de Atención
                                        </label>
                                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                            {formValues.operatingSchedule.map((item, index) => (
                                                <div key={item.day} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-800">
                                                    <div className="flex items-center gap-2 w-32">
                                                        <input
                                                            type="checkbox"
                                                            checked={item.isActive}
                                                            onChange={(e) => handleScheduleChange(index, 'isActive', e.target.checked)}
                                                            className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-600"
                                                        />
                                                        <span className={`text-sm font-medium ${!item.isActive && 'text-gray-400 line-through'}`}>
                                                            {item.label}
                                                        </span>
                                                    </div>

                                                    <div className={`flex gap-2 flex-1 items-center transition-opacity ${!item.isActive ? 'opacity-50 pointer-events-none' : ''}`}>
                                                        <input
                                                            type="time"
                                                            value={item.open}
                                                            onChange={(e) => handleScheduleChange(index, 'open', e.target.value)}
                                                            className="block w-full rounded border-0 py-1.5 text-gray-900 dark:text-white dark:bg-zinc-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-xs sm:leading-6"
                                                        />
                                                        <span className="text-gray-400">-</span>
                                                        <input
                                                            type="time"
                                                            value={item.close}
                                                            onChange={(e) => handleScheduleChange(index, 'close', e.target.value)}
                                                            className="block w-full rounded border-0 py-1.5 text-gray-900 dark:text-white dark:bg-zinc-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-xs sm:leading-6"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Tiempo Entrega Promedio
                                        </label>
                                        <div className="relative">
                                            <select
                                                name="deliveryTime"
                                                id="deliveryTime"
                                                required
                                                value={formValues.deliveryTime}
                                                onChange={handleInputChange}
                                                className="block w-full appearance-none rounded-lg border-0 py-3 pl-4 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 dark:bg-zinc-800 dark:text-white dark:ring-gray-700 sm:text-sm sm:leading-6 transition-all duration-200"
                                            >
                                                <option value="15-30">15 - 30 min</option>
                                                <option value="30-45">30 - 45 min</option>
                                                <option value="45-60">45 - 60 min</option>
                                                <option value="60-90">60 - 90 min</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-white">
                                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>



                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            disabled={isPending}
                                            className="flex-1 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-800 px-3 py-3 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all"
                                        >
                                            Atrás
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isPending}
                                            className="flex-1 flex items-center justify-center rounded-lg bg-orange-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {isPending ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <>Completar Registro <Check size={16} className="ml-2" /></>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>

                </div>
            </div>
        </div>
    );
}
