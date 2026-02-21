'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Role, UserRole, RoleName } from '@/lib/types'

// ─────────────────────────────────────────────────────────────────
// Get the current user's role in a given business
// ─────────────────────────────────────────────────────────────────
export async function getMyRole(businessmanId: string): Promise<RoleName | null> {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_my_role', {
        p_businessman_id: businessmanId,
    })
    if (error || !data) return null
    return data as RoleName
}

// ─────────────────────────────────────────────────────────────────
// Tell if the current user is the OWNER of the business
// (user_id match in businessmans table — not via user_roles)
// ─────────────────────────────────────────────────────────────────
export async function isOwnerOfBusiness(businessmanId: string): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data } = await supabase
        .from('businessmans')
        .select('id')
        .eq('id', businessmanId)
        .eq('user_id', user.id)
        .single()

    return !!data
}

// ─────────────────────────────────────────────────────────────────
// List all roles catalog
// ─────────────────────────────────────────────────────────────────
export async function getAllRoles(): Promise<Role[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('created_at', { ascending: true })

    if (error || !data) return []
    return data as Role[]
}

// ─────────────────────────────────────────────────────────────────
// List all team members of a business (with profile and role info)
// ─────────────────────────────────────────────────────────────────
export async function getTeamMembers(businessmanId: string): Promise<UserRole[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('user_roles')
        .select(`
            id,
            user_id,
            businessman_id,
            role_id,
            invited_email,
            status,
            invited_by,
            created_at,
            role:roles(id, name, description, created_at),
            profile:profiles(id, full_name, avatar_url)
        `)
        .eq('businessman_id', businessmanId)
        .order('created_at', { ascending: true })

    if (error || !data) {
        console.error('getTeamMembers error:', error)
        return []
    }

    return data as unknown as UserRole[]
}

// ─────────────────────────────────────────────────────────────────
// Invite a team member by email
// Creates a pending user_role row; the user will be auto-linked
// when they register / log in with that email.
// ─────────────────────────────────────────────────────────────────
export async function inviteTeamMember(payload: {
    businessmanId: string
    email: string
    roleId: string
}): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    // Check if email already has a user in auth
    // We try to find a profile by looking at businessmans + auth data
    // (we can't enumerate auth.users directly from client)

    // Check for duplicate invitation
    const { data: existing } = await supabase
        .from('user_roles')
        .select('id, status')
        .eq('businessman_id', payload.businessmanId)
        .eq('invited_email', payload.email.toLowerCase())
        .single()

    if (existing) {
        if (existing.status === 'active') {
            return { success: false, error: 'Este correo ya es miembro del equipo.' }
        }
        if (existing.status === 'pending') {
            return { success: false, error: 'Ya existe una invitación pendiente para este correo.' }
        }
    }

    const { error } = await supabase.from('user_roles').insert({
        businessman_id: payload.businessmanId,
        role_id: payload.roleId,
        invited_email: payload.email.toLowerCase(),
        status: 'pending',
        invited_by: user.id,
        // user_id will be filled when they accept
    })

    if (error) {
        console.error('inviteTeamMember error:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/team')
    return { success: true }
}

// ─────────────────────────────────────────────────────────────────
// Change the role of an existing member
// ─────────────────────────────────────────────────────────────────
export async function updateMemberRole(payload: {
    userRoleId: string
    newRoleId: string
    businessmanId: string
}): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('user_roles')
        .update({ role_id: payload.newRoleId })
        .eq('id', payload.userRoleId)
        .eq('businessman_id', payload.businessmanId)

    if (error) {
        console.error('updateMemberRole error:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/team')
    return { success: true }
}

// ─────────────────────────────────────────────────────────────────
// Revoke access to a team member
// ─────────────────────────────────────────────────────────────────
export async function revokeMember(payload: {
    userRoleId: string
    businessmanId: string
}): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('user_roles')
        .update({ status: 'revoked' })
        .eq('id', payload.userRoleId)
        .eq('businessman_id', payload.businessmanId)

    if (error) {
        console.error('revokeMember error:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/team')
    return { success: true }
}

// ─────────────────────────────────────────────────────────────────
// Reactivate a revoked member
// ─────────────────────────────────────────────────────────────────
export async function reactivateMember(payload: {
    userRoleId: string
    businessmanId: string
}): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('user_roles')
        .update({ status: 'active' })
        .eq('id', payload.userRoleId)
        .eq('businessman_id', payload.businessmanId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/team')
    return { success: true }
}

// ─────────────────────────────────────────────────────────────────
// Link pending invitations when user logs in
// Called once per session, matches invited_email to user.email
// ─────────────────────────────────────────────────────────────────
export async function linkPendingInvitations(): Promise<void> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return

    // Update all pending rows that match this user's email
    const { error } = await supabase
        .from('user_roles')
        .update({ user_id: user.id, status: 'active' })
        .eq('invited_email', user.email.toLowerCase())
        .eq('status', 'pending')
        .is('user_id', null)

    if (error) {
        console.error('linkPendingInvitations error:', error)
    }
}
