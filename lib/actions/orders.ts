"use server";

import { createClient } from "@/lib/supabase/server";
import { DashboardOrder, OrderStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function getOrders(businessmanId: string) {
    const supabase = await createClient();

    // We select *, and join related tables if needed
    // dashboard-schema.sql implies orders have order_items
    const { data, error } = await supabase
        .from("orders")
        .select(`
            *,
            order_items (
                *,
                order_item_modifiers (*)
            )
        `)
        .eq("businessman_id", businessmanId)
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) {
        console.error("Error fetching orders:", error);
        return [];
    }

    return data as DashboardOrder[];
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", orderId);

    if (error) {
        console.error("Error updating order status:", error);
        return { success: false, error: error.message };
    }

    // Also log to history if table exists (from schema check earlier)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await supabase
            .from('order_status_history')
            .insert({
                order_id: orderId,
                status: status,
                changed_by: user.id
            })
            .select()
            .single()
            // Ignore error for history logging to prevent blocking the UI flow
            .then(({ error }) => {
                if (error) console.warn("Failed to log order history:", error)
            });
    }

    revalidatePath("/orders");
    revalidatePath("/"); // Update dashboard stats too
    return { success: true };
}
