'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Zone, RestaurantTable } from '@/lib/types'

// --- Zones ---

export async function getZones(businessmanId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('zones')
        .select(`
            *,
            tables:restaurant_tables(*)
        `)
        .eq('businessman_id', businessmanId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching zones:', error)
        return []
    }

    return data as Zone[]
}

export async function createZone(businessmanId: string, name: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('zones')
        .insert({
            businessman_id: businessmanId,
            name,
            is_active: true
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating zone:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/settings')
    return { success: true, data }
}

export async function deleteZone(zoneId: string) {
    const supabase = await createClient()
    // Soft delete usually better, but requirements didn't specify. 
    // Let's do hard delete for now as per schema or soft delete?
    // Schema has is_active, let's use soft delete or toggle.
    // For "management", often users expect removal.
    // Given the migration used CASCADE, hard delete is supported.
    // Let's assume hard delete for cleanup for now to match "Gestion" simplicity.
    const { error } = await supabase
        .from('zones')
        .delete()
        .eq('id', zoneId)

    if (error) {
        console.error('Error deleting zone:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/settings')
    return { success: true }
}

// --- Tables ---

export async function createTable(businessmanId: string, zoneId: string, name: string, capacity: number = 4) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('restaurant_tables')
        .insert({
            businessman_id: businessmanId,
            zone_id: zoneId,
            name,
            capacity,
            is_active: true
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating table:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/settings')
    return { success: true, data }
}

export async function deleteTable(tableId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('restaurant_tables')
        .delete()
        .eq('id', tableId)

    if (error) {
        console.error('Error deleting table:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/settings')
    return { success: true }
}
