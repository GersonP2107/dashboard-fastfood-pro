"use server";

import { createClient } from "@/lib/supabase/server";
import { Category } from "@/lib/types/base-types";
import { revalidatePath } from "next/cache";

export async function getAllCategories(businessmanId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("businessman_id", businessmanId)
        .order("order", { ascending: true })
        .order("name", { ascending: true });

    if (error) {
        console.error("Error fetching all categories:", error);
        return [];
    }

    return data as Category[];
}

export async function createCategory(formData: FormData) {
    const supabase = await createClient();
    const rawData = Object.fromEntries(formData.entries());

    const {
        businessman_id,
        name,
        description,
        is_active,
        order
    } = rawData;

    const categoryData = {
        businessman_id: businessman_id as string,
        name: name as string,
        description: description ? (description as string) : null,
        is_active: is_active === "true",
        order: order ? parseInt(order as string) : 0,
    };

    const { data, error } = await supabase
        .from("categories")
        .insert(categoryData)
        .select()
        .single();

    if (error) {
        console.error("Error creating category:", error);
        return { error: error.message };
    }

    revalidatePath("/categories");
    revalidatePath("/products"); // Products page uses categories too
    return { success: true, category: data as Category };
}

export async function updateCategory(id: string, formData: FormData) {
    const supabase = await createClient();
    const rawData = Object.fromEntries(formData.entries());

    const {
        name,
        description,
        is_active,
        order
    } = rawData;

    const updates = {
        name: name as string,
        description: description ? (description as string) : null,
        is_active: is_active === "true",
        order: order ? parseInt(order as string) : 0,
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id);

    if (error) {
        console.error("Error updating category:", error);
        return { error: error.message };
    }

    revalidatePath("/categories");
    revalidatePath("/products");
    return { success: true };
}

export async function deleteCategory(id: string) {
    // Hard delete for now, or check if products exist?
    // Usually categories are soft-deleted or just checked. 
    // Types don't show deleted_at for Category, so assume hard delete or we rely on isActive
    // For now, let's try delete, if FK constraint fails Supabase will error.

    const supabase = await createClient();

    const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting category:", error);
        // This is likely due to foreign key constraints if products exist
        return { error: "No se puede eliminar la categoría porque puede tener productos asociados. Intenta desactivarla." };
    }

    revalidatePath("/categories");
    revalidatePath("/products");
    return { success: true };
}

export async function toggleCategoryStatus(id: string, currentStatus: boolean) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("categories")
        .update({ is_active: !currentStatus })
        .eq("id", id);

    if (error) {
        console.error("Error toggling category status:", error);
        return { error: error.message };
    }

    revalidatePath("/categories");
    revalidatePath("/products");
    return { success: true };
}
