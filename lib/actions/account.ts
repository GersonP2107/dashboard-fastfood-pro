'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { UserProfile } from '@/lib/types'

// ─────────────────────────────────────────────
// GET profile of the currently authenticated user
// ─────────────────────────────────────────────
export async function getUserProfile(): Promise<UserProfile | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (error) {
        console.error('Error fetching profile:', error)
        return null
    }

    return data as UserProfile
}

// ─────────────────────────────────────────────
// UPDATE profile fields (name, avatar, phone)
// ─────────────────────────────────────────────
export async function updateUserProfile(payload: {
    full_name?: string
    avatar_url?: string
    phone?: string
}): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'No autenticado' }

    const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...payload }, { onConflict: 'id' })

    if (error) {
        console.error('Error updating profile:', error)
        return { success: false, error: error.message }
    }

    // Also keep user_metadata in sync so sidebar shows latest name/avatar
    await supabase.auth.updateUser({
        data: {
            full_name: payload.full_name,
            avatar_url: payload.avatar_url,
        },
    })

    revalidatePath('/account')
    return { success: true }
}

// ─────────────────────────────────────────────
// UPDATE email (sends a confirmation email)
// ─────────────────────────────────────────────
export async function updateEmail(
    newEmail: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({ email: newEmail })

    if (error) {
        console.error('Error updating email:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

// ─────────────────────────────────────────────
// UPDATE password
// ─────────────────────────────────────────────
export async function updatePassword(
    newPassword: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
        console.error('Error updating password:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

// ─────────────────────────────────────────────
// GET current auth user (email, metadata, etc.)
// ─────────────────────────────────────────────
export async function getAuthUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
}
