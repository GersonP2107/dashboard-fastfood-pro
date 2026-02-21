'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCurrentBusinessman } from '@/lib/actions/users'
import { getAllRoles, getTeamMembers, inviteTeamMember, updateMemberRole, revokeMember, reactivateMember } from '@/lib/actions/roles'
import { Businessman, Role, UserRole, RoleName } from '@/lib/types'
import {
    Users, UserPlus, Mail, Shield, ChevronDown, MoreVertical,
    UserX, UserCheck, RefreshCw, AlertCircle, CheckCircle2, Crown, X
} from 'lucide-react'

// ─── helpers ──────────────────────────────────────────────────────

const ROLE_COLORS: Record<RoleName, string> = {
    admin: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
    gerente: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800',
    empleado: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800',
    cocinero: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
}

const STATUS_COLORS = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    revoked: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
}
const STATUS_LABELS = { active: 'Activo', pending: 'Pendiente', revoked: 'Revocado' }

function getInitials(name: string | null | undefined, email: string | null | undefined) {
    if (name) return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    if (email) return email[0].toUpperCase()
    return '?'
}

function Alert({ type, message, onClose }: { type: 'success' | 'error'; message: string; onClose?: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${type === 'success'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                }`}
        >
            {type === 'success' ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
            <span className="flex-1">{message}</span>
            {onClose && <button onClick={onClose}><X className="size-4" /></button>}
        </motion.div>
    )
}

// ─── Invite modal ─────────────────────────────────────────────────
function InviteModal({
    roles,
    businessmanId,
    onSuccess,
    onClose,
}: {
    roles: Role[]
    businessmanId: string
    onSuccess: () => void
    onClose: () => void
}) {
    const [email, setEmail] = useState('')
    const [roleId, setRoleId] = useState(roles[0]?.id ?? '')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !roleId) return
        setLoading(true)
        setError(null)
        const res = await inviteTeamMember({ businessmanId, email, roleId })
        setLoading(false)
        if (res.success) {
            onSuccess()
            onClose()
        } else {
            setError(res.error ?? 'Error al enviar la invitación.')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-brand-primary">
                        <UserPlus className="size-5" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Invitar miembro</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <X className="size-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Correo electrónico</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="correo@ejemplo.com"
                                required
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rol</label>
                        <div className="relative">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                            <select
                                value={roleId}
                                onChange={e => setRoleId(e.target.value)}
                                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all appearance-none"
                            >
                                {roles.map(r => (
                                    <option key={r.id} value={r.id}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {error && <Alert type="error" message={error} />}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold shadow-md shadow-brand-primary/25 hover:bg-brand-accent transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {loading ? <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus className="size-4" />}
                            Invitar
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}

// ─── Member card ──────────────────────────────────────────────────
function MemberCard({
    member,
    roles,
    businessmanId,
    isOwner,
    onChange,
}: {
    member: UserRole
    roles: Role[]
    businessmanId: string
    isOwner: (m: UserRole) => boolean
    onChange: () => void
}) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [changingRole, setChangingRole] = useState(false)
    const [loading, setLoading] = useState(false)

    const displayName = member.profile?.full_name ?? member.invited_email ?? member.user_id ?? '—'
    const displayEmail = member.invited_email ?? '—'
    const roleName = (member.role?.name ?? 'empleado') as RoleName

    const handleRoleChange = async (newRoleId: string) => {
        setLoading(true)
        await updateMemberRole({ userRoleId: member.id, newRoleId, businessmanId })
        setLoading(false)
        setChangingRole(false)
        onChange()
    }

    const handleRevoke = async () => {
        setLoading(true)
        await revokeMember({ userRoleId: member.id, businessmanId })
        setLoading(false)
        setMenuOpen(false)
        onChange()
    }

    const handleReactivate = async () => {
        setLoading(true)
        await reactivateMember({ userRoleId: member.id, businessmanId })
        setLoading(false)
        setMenuOpen(false)
        onChange()
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-sm transition-shadow"
        >
            {/* Avatar */}
            <div className="size-10 rounded-full bg-linear-to-br from-brand-primary to-brand-accent flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden shadow">
                {member.profile?.avatar_url ? (
                    <img src={member.profile.avatar_url} alt={displayName} className="size-full object-cover" />
                ) : (
                    <span>{getInitials(member.profile?.full_name, member.invited_email)}</span>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{displayName}</p>
                    {isOwner(member) && (
                        <Crown className="size-3.5 text-amber-500 shrink-0" aria-label="Propietario" />
                    )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{displayEmail}</p>
            </div>

            {/* Role badge */}
            {changingRole ? (
                <select
                    className="text-xs border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1 bg-white dark:bg-zinc-800 text-gray-800 dark:text-white"
                    defaultValue={member.role_id}
                    onChange={e => handleRoleChange(e.target.value)}
                    disabled={loading}
                    onBlur={() => setChangingRole(false)}
                    autoFocus
                >
                    {roles.map(r => (
                        <option key={r.id} value={r.id}>
                            {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
                        </option>
                    ))}
                </select>
            ) : (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ROLE_COLORS[roleName] ?? ''}`}>
                    {roleName.charAt(0).toUpperCase() + roleName.slice(1)}
                </span>
            )}

            {/* Status badge */}
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[member.status]}`}>
                {STATUS_LABELS[member.status]}
            </span>

            {/* Actions menu */}
            <div className="relative shrink-0">
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="size-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-600 transition-colors"
                    disabled={loading}
                >
                    {loading ? (
                        <span className="size-4 border-2 border-gray-300 border-t-brand-primary rounded-full animate-spin" />
                    ) : (
                        <MoreVertical className="size-4" />
                    )}
                </button>

                <AnimatePresence>
                    {menuOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            className="absolute right-0 top-10 z-20 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-800 py-1 overflow-hidden"
                        >
                            <button
                                onClick={() => { setChangingRole(true); setMenuOpen(false) }}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <Shield className="size-4" /> Cambiar rol
                            </button>
                            {member.status === 'active' || member.status === 'pending' ? (
                                <button
                                    onClick={handleRevoke}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                >
                                    <UserX className="size-4" /> Revocar acceso
                                </button>
                            ) : (
                                <button
                                    onClick={handleReactivate}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors"
                                >
                                    <UserCheck className="size-4" /> Reactivar
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
export default function TeamPage() {
    const [business, setBusiness] = useState<Businessman | null>(null)
    const [members, setMembers] = useState<UserRole[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [loading, setLoading] = useState(true)
    const [showInvite, setShowInvite] = useState(false)
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

    const loadData = async () => {
        const biz = await getCurrentBusinessman()
        if (!biz) return
        setBusiness(biz)
        const [membersData, rolesData] = await Promise.all([
            getTeamMembers(biz.id),
            getAllRoles(),
        ])
        setMembers(membersData)
        setRoles(rolesData)
        setLoading(false)
    }

    useEffect(() => { loadData() }, [])

    const handleInviteSuccess = () => {
        setFeedback({ type: 'success', msg: 'Invitación creada. El miembro aparecerá como "Pendiente" hasta que acepte.' })
        loadData()
        setTimeout(() => setFeedback(null), 5000)
    }

    const isOwner = (m: UserRole) => business?.user_id === m.user_id

    // Stats
    const activeCount = members.filter(m => m.status === 'active').length
    const pendingCount = members.filter(m => m.status === 'pending').length

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary" />
            </div>
        )
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Equipo</h1>
                        <p className="mt-1 text-gray-500 dark:text-gray-400">
                            Administra los miembros y roles de tu negocio
                        </p>
                    </div>
                    <button
                        id="invite-member-btn"
                        onClick={() => setShowInvite(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-primary/25 hover:bg-brand-accent transition-colors"
                    >
                        <UserPlus className="size-4" />
                        Invitar miembro
                    </button>
                </div>

                {/* Feedback */}
                <AnimatePresence>
                    {feedback && (
                        <Alert type={feedback.type} message={feedback.msg} onClose={() => setFeedback(null)} />
                    )}
                </AnimatePresence>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'Total miembros', value: members.length, icon: Users, color: 'text-brand-primary' },
                        { label: 'Activos', value: activeCount, icon: UserCheck, color: 'text-emerald-600' },
                        { label: 'Pendientes', value: pendingCount, icon: RefreshCw, color: 'text-yellow-600' },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 flex items-center gap-4">
                            <div className={`size-10 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center ${stat.color}`}>
                                <stat.icon className="size-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Roles reference */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-6">
                    <div className="flex items-center gap-2 mb-4 text-brand-primary border-b border-gray-100 dark:border-gray-800 pb-4">
                        <Shield className="size-5" />
                        <h2 className="text-lg font-semibold">Roles disponibles</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {roles.map(role => (
                            <div key={role.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800">
                                <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border mt-0.5 ${ROLE_COLORS[role.name as RoleName] ?? ''}`}>
                                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                                </span>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{role.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Member list */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-6">
                    <div className="flex items-center gap-2 mb-6 text-brand-primary border-b border-gray-100 dark:border-gray-800 pb-4">
                        <Users className="size-5" />
                        <h2 className="text-lg font-semibold">Miembros del equipo</h2>
                        <span className="ml-auto text-xs bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">
                            {members.length}
                        </span>
                    </div>

                    {members.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="size-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                Aún no tienes miembros en el equipo.
                            </p>
                            <button
                                onClick={() => setShowInvite(true)}
                                className="mt-3 text-sm text-brand-primary font-medium hover:underline"
                            >
                                Invita al primero →
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <AnimatePresence>
                                {members.map(member => (
                                    <MemberCard
                                        key={member.id}
                                        member={member}
                                        roles={roles}
                                        businessmanId={business!.id}
                                        isOwner={isOwner}
                                        onChange={loadData}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Invite modal */}
            <AnimatePresence>
                {showInvite && business && (
                    <InviteModal
                        roles={roles}
                        businessmanId={business.id}
                        onSuccess={handleInviteSuccess}
                        onClose={() => setShowInvite(false)}
                    />
                )}
            </AnimatePresence>
        </>
    )
}
