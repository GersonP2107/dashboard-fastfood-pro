"use server";

import { createClient } from "@/lib/supabase/server";
import { Businessman, DeliveryZone } from "@/lib/types";
import { revalidatePath } from "next/cache";

// --- Business Profile Actions ---

import { differenceInDays, addDays, format } from "date-fns";
import { es } from "date-fns/locale";

export async function updateBusinessProfile(businessmanId: string, formData: Partial<Businessman>) {
    const supabase = await createClient();

    // 1. Fetch current data to verify rules
    const { data: currentData, error: fetchError } = await supabase
        .from("businessmans")
        .select("business_name, last_name_change")
        .eq("id", businessmanId)
        .single();

    if (fetchError || !currentData) {
        console.error("Error fetching current profile:", fetchError);
        return { success: false, error: "No se pudo verificar la información actual." };
    }

    const updates: any = { ...formData, updated_at: new Date().toISOString() };

    // 2. Check if name is changing
    if (formData.business_name && formData.business_name !== currentData.business_name) {
        const lastChange = currentData.last_name_change ? new Date(currentData.last_name_change) : null;

        if (lastChange) {
            const daysSinceChange = differenceInDays(new Date(), lastChange);
            const LIMIT_DAYS = 365; // 1 year limit

            if (daysSinceChange < LIMIT_DAYS) {
                const nextChangeDate = addDays(lastChange, LIMIT_DAYS);
                return {
                    success: false,
                    error: `Solo puedes cambiar el nombre una vez al año. Podrás cambiarlo nuevamente el ${format(nextChangeDate, "d 'de' MMMM 'de' yyyy", { locale: es })}.`
                };
            }
        }

        // Allow change and update timestamp
        updates.last_name_change = new Date().toISOString();

        // IMPORTANT: We DO regenerate the slug because the user explicitly wants this behavior.
        // This will break existing QR codes.
        const newSlug = formData.business_name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');

        updates.slug = newSlug;
    }

    const { error } = await supabase
        .from("businessmans")
        .update(updates)
        .eq("id", businessmanId);

    if (error) {
        console.error("Error updating business profile:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/settings");
    revalidatePath("/"); // Update dashboard header/sidebar if name/logo changes
    return { success: true };
}

// --- Delivery Zone Actions ---

export async function getDeliveryZones(businessmanId: string) {
    const supabase = await createClient();
    console.log("Fetching zones for businessman:", businessmanId);

    const { data, error } = await supabase
        .from("delivery_zones")
        .select("*")
        .eq("businessman_id", businessmanId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error fetching delivery zones:", error);
        return [];
    }

    console.log("Zones fetched:", data);
    return data as DeliveryZone[];
}

export async function createDeliveryZone(businessmanId: string, zone: Partial<DeliveryZone>) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("delivery_zones")
        .insert({
            ...zone,
            businessman_id: businessmanId,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating delivery zone:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/settings");
    return { success: true, data };
}

export async function updateDeliveryZone(zoneId: string, zone: Partial<DeliveryZone>) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("delivery_zones")
        .update({
            ...zone,
            updated_at: new Date().toISOString(),
        })
        .eq("id", zoneId)
        .select()
        .single();

    if (error) {
        console.error("Error updating delivery zone:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/settings");
    return { success: true, data };
}

export async function deleteDeliveryZone(zoneId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("delivery_zones")
        .delete()
        .eq("id", zoneId);

    if (error) {
        console.error("Error deleting delivery zone:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/settings");
    return { success: true };
}
