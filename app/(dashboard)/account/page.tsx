'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
    getUserProfile,
    getAuthUser,
    updateUserProfile,
    updateEmail,
    updatePassword,
} from '@/lib/actions/account'
import { UserProfile } from '@/lib/types'
import {
    User,
    Mail,
    Lock,
    Camera,
    Save,
    AlertCircle,
    CheckCircle2,
    Eye,
    EyeOff,
    ShieldCheck,
    Pencil,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ─── small utility ───────────────────────────────────────────────
function Alert({
    type,
    message,
}: {
    type: 'success' | 'error'
    message: string
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${type === 'success'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                }`}
        >
            {type === 'success' ? (
                <CheckCircle2 className="size-4 shrink-0" />
            ) : (
                <AlertCircle className="size-4 shrink-0" />
            )}
            {message}
        </motion.div>
    )
}

// ─── card wrapper ─────────────────────────────────────────────────
function Card({
    icon: Icon,
    title,
    children,
}: {
    icon: React.ElementType
    title: string
    children: React.ReactNode
}) {
    return (
        <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-3xl border border-gray-100 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-2 mb-6 text-brand-primary dark:text-brand-light border-b border-gray-100 dark:border-gray-800 pb-4">
                <Icon className="h-5 w-5" />
                <h2 className="text-lg font-semibold">{title}</h2>
            </div>
            {children}
        </div>
    )
}

// ─── input ────────────────────────────────────────────────────────
function Input({
    label,
    id,
    type = 'text',
    value,
    onChange,
    placeholder,
    rightElement,
}: {
    label: string
    id: string
    type?: string
    value: string
    onChange: (v: string) => void
    placeholder?: string
    rightElement?: React.ReactNode
}) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all pr-10"
                />
                {rightElement && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {rightElement}
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── avatar upload ────────────────────────────────────────────────
// Auto-saves on upload and triggers router.refresh() so the sidebar
// (Server Component) re-renders with the new avatar.
function AvatarUpload({
    avatarUrl,
    fullName,
    onUploaded,
}: {
    avatarUrl: string
    fullName: string
    onUploaded: (url: string) => Promise<void>
}) {
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const initials = fullName
        ? fullName
            .split(' ')
            .map((w) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()
        : 'U'

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        setUploadError(null)

        // Validate size (2 MB)
        if (file.size > 2 * 1024 * 1024) {
            setUploadError('La imagen debe pesar menos de 2 MB.')
            setUploading(false)
            return
        }

        try {
            const ext = file.name.split('.').pop()
            // Use user-scoped filename to allow upsert without conflicts
            const fileName = `avatar-${Date.now()}.${ext}`
            const { error: storageError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true })
            if (storageError) throw storageError

            const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
            // onUploaded auto-saves to DB + auth metadata + refreshes sidebar
            await onUploaded(data.publicUrl)
        } catch (err: unknown) {
            console.error('Avatar upload error:', err)
            const message = err instanceof Error ? err.message : 'Error al subir la imagen.'
            setUploadError(message)
        } finally {
            setUploading(false)
            // Reset input so same file can be re-selected
            if (fileRef.current) fileRef.current.value = ''
        }
    }

    return (
        <div className="flex items-center gap-5 mb-6">
            <div className="relative">
                <div className="size-20 rounded-2xl overflow-hidden bg-linear-to-br from-brand-primary to-brand-accent flex items-center justify-center shadow-lg shadow-brand-primary/20">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="size-full object-cover"
                        />
                    ) : (
                        <span className="text-2xl font-bold text-white">{initials}</span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-2 -right-2 size-8 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-md hover:bg-brand-accent transition-colors disabled:opacity-60"
                    aria-label="Cambiar foto de perfil"
                >
                    {uploading ? (
                        <span className="size-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Camera className="size-3.5" />
                    )}
                </button>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleFile}
                />
            </div>
            <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    Foto de perfil
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    JPG, PNG o WebP · Máx. 2 MB
                </p>
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="mt-1.5 text-xs text-brand-primary font-medium hover:underline disabled:opacity-50"
                >
                    {uploading ? 'Subiendo...' : 'Cambiar imagen'}
                </button>
                {uploadError && (
                    <p className="mt-1 text-xs text-red-500">{uploadError}</p>
                )}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
export default function AccountPage() {
    const router = useRouter()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [authEmail, setAuthEmail] = useState('')
    const [loading, setLoading] = useState(true)

    // — profile fields —
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [profileStatus, setProfileStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [savingProfile, setSavingProfile] = useState(false)

    // — email —
    const [newEmail, setNewEmail] = useState('')
    const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [savingEmail, setSavingEmail] = useState(false)

    // — password —
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [savingPassword, setSavingPassword] = useState(false)

    useEffect(() => {
        const load = async () => {
            const [prof, user] = await Promise.all([getUserProfile(), getAuthUser()])
            if (prof) {
                setProfile(prof)
                setFullName(prof.full_name ?? '')
                setPhone(prof.phone ?? '')
                setAvatarUrl(prof.avatar_url ?? '')
            }
            if (user) setAuthEmail(user.email ?? '')
            setLoading(false)
        }
        load()
    }, [])

    // Auto-save avatar immediately after upload + refresh sidebar
    const handleAvatarUploaded = async (url: string) => {
        setAvatarUrl(url)
        const res = await updateUserProfile({ avatar_url: url })
        if (res.success) {
            // Force the Server Component layout to re-render so the sidebar
            // picks up the new avatar_url from user_metadata
            router.refresh()
        }
    }

    const handleSaveProfile = async () => {
        setSavingProfile(true)
        setProfileStatus(null)
        const res = await updateUserProfile({ full_name: fullName, phone, avatar_url: avatarUrl })
        setProfileStatus(
            res.success
                ? { type: 'success', msg: 'Perfil actualizado correctamente.' }
                : { type: 'error', msg: res.error ?? 'Error al guardar.' }
        )
        setSavingProfile(false)
        if (res.success) {
            // Refresh sidebar to reflect any name/avatar changes
            router.refresh()
            setTimeout(() => setProfileStatus(null), 4000)
        }
    }

    const handleUpdateEmail = async () => {
        if (!newEmail) return
        setSavingEmail(true)
        setEmailStatus(null)
        const res = await updateEmail(newEmail)
        setEmailStatus(
            res.success
                ? { type: 'success', msg: 'Te enviamos un enlace de confirmación al nuevo correo.' }
                : { type: 'error', msg: res.error ?? 'Error al actualizar.' }
        )
        setSavingEmail(false)
        if (res.success) setNewEmail('')
    }

    const handleUpdatePassword = async () => {
        if (newPassword !== confirmPassword) {
            setPasswordStatus({ type: 'error', msg: 'Las contraseñas no coinciden.' })
            return
        }
        if (newPassword.length < 6) {
            setPasswordStatus({ type: 'error', msg: 'Mínimo 6 caracteres.' })
            return
        }
        setSavingPassword(true)
        setPasswordStatus(null)
        const res = await updatePassword(newPassword)
        setPasswordStatus(
            res.success
                ? { type: 'success', msg: 'Contraseña actualizada exitosamente.' }
                : { type: 'error', msg: res.error ?? 'Error al actualizar.' }
        )
        setSavingPassword(false)
        if (res.success) {
            setNewPassword('')
            setConfirmPassword('')
            setTimeout(() => setPasswordStatus(null), 4000)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary" />
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* ── Header ── */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Mi Cuenta
                </h1>
                <p className="mt-1 text-gray-500 dark:text-gray-400">
                    Administra tu información personal y credenciales de acceso
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Left column ── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Perfil personal */}
                    <Card icon={User} title="Información Personal">
                        <AvatarUpload
                            avatarUrl={avatarUrl}
                            fullName={fullName}
                            onUploaded={handleAvatarUploaded}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Nombre completo"
                                id="full-name"
                                value={fullName}
                                onChange={setFullName}
                                placeholder="Tu nombre"
                            />
                            <Input
                                label="Teléfono personal"
                                id="phone"
                                type="tel"
                                value={phone}
                                onChange={setPhone}
                                placeholder="+57 300 000 0000"
                            />
                        </div>
                        {profileStatus && (
                            <div className="mt-4">
                                <Alert type={profileStatus.type} message={profileStatus.msg} />
                            </div>
                        )}
                        <div className="flex justify-end mt-5">
                            <button
                                id="save-profile-btn"
                                onClick={handleSaveProfile}
                                disabled={savingProfile}
                                className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-primary/25 hover:bg-brand-accent transition-colors disabled:opacity-60"
                            >
                                {savingProfile ? (
                                    <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Save className="size-4" />
                                )}
                                Guardar cambios
                            </button>
                        </div>
                    </Card>

                    {/* Contraseña */}
                    <Card icon={Lock} title="Cambiar Contraseña">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                            Elige una contraseña segura de al menos 6 caracteres.
                        </p>
                        <div className="space-y-4">
                            <Input
                                label="Nueva contraseña"
                                id="new-password"
                                type={showNew ? 'text' : 'password'}
                                value={newPassword}
                                onChange={setNewPassword}
                                placeholder="••••••••"
                                rightElement={
                                    <button
                                        type="button"
                                        onClick={() => setShowNew(!showNew)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                        aria-label={showNew ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                }
                            />
                            <Input
                                label="Confirmar contraseña"
                                id="confirm-password"
                                type={showConfirm ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={setConfirmPassword}
                                placeholder="••••••••"
                                rightElement={
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                        aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                }
                            />
                        </div>
                        {passwordStatus && (
                            <div className="mt-4">
                                <Alert type={passwordStatus.type} message={passwordStatus.msg} />
                            </div>
                        )}
                        <div className="flex justify-end mt-5">
                            <button
                                id="save-password-btn"
                                onClick={handleUpdatePassword}
                                disabled={savingPassword || !newPassword}
                                className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-primary/25 hover:bg-brand-accent transition-colors disabled:opacity-60"
                            >
                                {savingPassword ? (
                                    <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <ShieldCheck className="size-4" />
                                )}
                                Actualizar contraseña
                            </button>
                        </div>
                    </Card>
                </div>

                {/* ── Right column ── */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Email */}
                    <Card icon={Mail} title="Correo Electrónico">
                        <div className="mb-4 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 px-4 py-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Correo actual</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{authEmail}</p>
                        </div>
                        <Input
                            label="Nuevo correo"
                            id="new-email"
                            type="email"
                            value={newEmail}
                            onChange={setNewEmail}
                            placeholder="nuevo@correo.com"
                        />
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            Recibirás un enlace de confirmación en el nuevo correo.
                        </p>
                        {emailStatus && (
                            <div className="mt-3">
                                <Alert type={emailStatus.type} message={emailStatus.msg} />
                            </div>
                        )}
                        <button
                            id="save-email-btn"
                            onClick={handleUpdateEmail}
                            disabled={savingEmail || !newEmail}
                            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-primary/25 hover:bg-brand-accent transition-colors disabled:opacity-60"
                        >
                            {savingEmail ? (
                                <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Pencil className="size-4" />
                            )}
                            Cambiar correo
                        </button>
                    </Card>

                    {/* Info de sesión */}
                    <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-3xl border border-gray-100 dark:border-zinc-800 p-6">
                        <div className="flex items-center gap-2 mb-4 text-brand-primary dark:text-brand-light border-b border-gray-100 dark:border-gray-800 pb-4">
                            <ShieldCheck className="h-5 w-5" />
                            <h2 className="text-lg font-semibold">Sesión</h2>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Proveedor</span>
                                <span className="font-medium text-gray-800 dark:text-white capitalize">Email</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Último acceso</span>
                                <span className="font-medium text-gray-800 dark:text-white">Hoy</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Estado</span>
                                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Activo
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
