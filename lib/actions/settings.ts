"use server";

import { createClient } from "@/lib/supabase/server";
import { Businessman, DeliveryZone } from "@/lib/types";
import { revalidatePath } from "next/cache";

// --- Business Profile Actions ---

export async function updateBusinessProfile(businessmanId: string, formData: Partial<Businessman>) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("businessmans")
        .update({
            ...formData,
            updated_at: new Date().toISOString(),
        })
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
