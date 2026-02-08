"use server";

import { createClient } from "@/lib/supabase/server";
import { Product, Category } from "@/lib/types/base-types";
import { revalidatePath } from "next/cache";

import { getCurrentBusinessman } from "@/lib/actions/users";

export { getCurrentBusinessman }; // Re-export for convenience if needed, or better just use the import in page

export async function getProducts(businessmanId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("products")
        .select("*, category:categories(*), product_modifiers(*, modifier:modifiers(*))")
        .eq("businessman_id", businessmanId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching products:", error);
        return [];
    }

    return data as Product[];
}

export async function getCategories(businessmanId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("businessman_id", businessmanId)
        .eq("is_active", true)
        .order("name", { ascending: true });

    if (error) {
        console.error("Error fetching categories:", error);
        return [];
    }

    return data as Category[];
}

export async function createProduct(formData: FormData) {
    const supabase = await createClient();
    const rawData = Object.fromEntries(formData.entries());

    // Extract necessary fields
    const {
        businessman_id,
        name,
        description,
        price,
        category_id,
        image_url,
        is_available,
    } = rawData;

    const productData = {
        businessman_id: businessman_id as string,
        name: name as string,
        description: description ? (description as string) : null,
        price: parseFloat(price as string),
        category_id: category_id ? (category_id as string) : null,
        image_url: image_url ? (image_url as string) : null,
        is_available: is_available === "true",
        // default values
        discount_price: null,
        limited_stock: false,
        stock_quantity: null,
        featured: false,
        order: 0,
    };

    // Check Plan Limits
    const { data: businessman } = await supabase
        .from('businessmans')
        .select('plan_type')
        .eq('id', businessman_id)
        .single();

    if (businessman?.plan_type === 'essential') {
        const { count, error: countError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('businessman_id', businessman_id)
            .is('deleted_at', null);

        if (!countError && count !== null && count >= 30) {
            return { error: 'Has alcanzado el límite de 30 productos de tu Plan Esencial. Actualiza a Profesional para productos ilimitados.' };
        }
    }

    const { data, error } = await supabase
        .from("products")
        .insert(productData)
        .select()
        .single();

    if (error) {
        console.error("Error creating product:", error);
        return { error: error.message };
    }

    revalidatePath("/products");
    return { success: true, product: data as Product };
}

export async function updateProduct(id: string, formData: FormData) {
    const supabase = await createClient();
    const rawData = Object.fromEntries(formData.entries());

    // Extract necessary fields
    const {
        name,
        description,
        price,
        category_id,
        image_url,
        is_available,
    } = rawData;


    const updates = {
        name: name as string,
        description: description ? (description as string) : null,
        price: parseFloat(price as string),
        category_id: category_id ? (category_id as string) : null,
        image_url: image_url ? (image_url as string) : null,
        is_available: is_available === "true",
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id);

    if (error) {
        console.error("Error updating product:", error);
        return { error: error.message };
    }

    revalidatePath("/products");
    return { success: true };
}

export async function deleteProduct(id: string) {
    // Soft delete
    const supabase = await createClient();

    const { error } = await supabase
        .from("products")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

    if (error) {
        console.error("Error deleting product:", error);
        return { error: error.message };
    }

    revalidatePath("/products");
    return { success: true };
}

export async function toggleProductStatus(id: string, currentStatus: boolean) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("products")
        .update({ is_available: !currentStatus })
        .eq("id", id);

    if (error) {
        console.error("Error toggling product status:", error);
        return { error: error.message };
    }

    revalidatePath("/products");
    return { success: true };
}

export async function updateProductStock(id: string, quantity: number | null) {
    const supabase = await createClient();

    const updates = {
        stock_quantity: quantity,
        limited_stock: quantity !== null, // Automatically set limited_stock if quantity is provided
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id);

    if (error) {
        console.error("Error updating product stock:", error);
        return { error: error.message };
    }

    revalidatePath("/inventory");
    revalidatePath("/products");
    return { success: true };
}
