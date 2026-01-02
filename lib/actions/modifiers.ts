"use server";

import { createClient } from "@/lib/supabase/server";
import { Modifier } from "@/lib/types/base-types";
import { revalidatePath } from "next/cache";

export async function getModifiers(businessmanId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("modifiers")
        .select("*")
        .eq("businessman_id", businessmanId)
        .order("name", { ascending: true });

    if (error) {
        console.error("Error fetching modifiers:", error);
        return [];
    }

    return data as Modifier[];
}

export async function createModifier(
    businessmanId: string,
    data: { name: string; description: string | null; additional_price: number; type: 'extra' | 'without' | 'option' }
) {
    const supabase = await createClient();
    const { data: newModifier, error } = await supabase
        .from("modifiers")
        .insert({
            businessman_id: businessmanId,
            ...data
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating modifier:", error);
        return { error: error.message };
    }

    revalidatePath("/products");
    return { success: true, modifier: newModifier as Modifier };
}

export async function updateModifier(
    id: string,
    data: { name: string; description: string | null; additional_price: number; type: 'extra' | 'without' | 'option' }
) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("modifiers")
        .update(data)
        .eq("id", id);

    if (error) {
        console.error("Error updating modifier:", error);
        return { error: error.message };
    }

    revalidatePath("/products");
    return { success: true };
}

export async function deleteModifier(id: string) {
    const supabase = await createClient();
    // Check if it's used? Ideally yes, but for now simple delete
    const { error } = await supabase
        .from("modifiers")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting modifier:", error);
        return { error: error.message };
    }

    revalidatePath("/products");
    return { success: true };
}

export async function addProductModifier(productId: string, modifierId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("product_modifiers")
        .insert({
            product_id: productId,
            modifier_id: modifierId,
            is_required: false, // Default to optional
        })
        .select(`
            id,
            is_required,
            modifier:modifiers(*)
        `)
        .single();

    if (error) {
        // Ignore duplicate key error (if already linked)
        if (error.code === '23505') return { success: true };
        console.error("Error linking modifier:", error);
        return { error: error.message };
    }

    revalidatePath("/products");
    return { success: true, productModifier: data };
}

export async function removeProductModifier(productModifierId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("product_modifiers")
        .delete()
        .eq("id", productModifierId);

    if (error) {
        console.error("Error unlinking modifier:", error);
        return { error: error.message };
    }

    revalidatePath("/products");
    return { success: true };
}

export async function toggleProductModifierRequired(productModifierId: string, isRequired: boolean) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("product_modifiers")
        .update({ is_required: isRequired })
        .eq("id", productModifierId);

    if (error) {
        console.error("Error updating modifier required status:", error);
        return { error: error.message };
    }

    revalidatePath("/products");
    return { success: true };
}
