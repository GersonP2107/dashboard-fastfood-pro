"use server";

import { createClient } from "@/lib/supabase/server";
import { DashboardOrder, OrderStatus } from "@/lib/types";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

export async function getOrders(businessmanId: string) {
    noStore();
    const supabase = await createClient();

    // 1. Fetch Orders first
    const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
            *,
            order_items (
                *,
                modifiers:order_item_modifiers (*)
            )
        `)
        .eq("businessman_id", businessmanId)
        .order("created_at", { ascending: false })
        .limit(100);

    if (ordersError) {
        console.error("Error fetching orders:", ordersError);
        return [];
    }

    // 2. Extract unique table_ids (manual join workaround due to missing FK)
    const tableIds = Array.from(new Set(
        ordersData
            .map((o: any) => o.table_id)
            .filter((id: any) => id) // filter nulls
    )) as string[];

    let tablesMap: Record<string, any> = {};

    // 3. Fetch tables if any exist
    if (tableIds.length > 0) {
        const { data: tablesData } = await supabase
            .from('restaurant_tables')
            .select(`
                id,
                label,
                restaurant_zones (
                    name
                )
            `)
            .in('id', tableIds);

        if (tablesData) {
            tablesMap = tablesData.reduce((acc: any, table: any) => {
                acc[table.id] = table;
                return acc;
            }, {});
        }
    }

    // 4. Stitch data together
    const ordersWithTables = ordersData.map((order: any) => ({
        ...order,
        restaurant_tables: order.table_id ? tablesMap[order.table_id] : null
    }));

    return ordersWithTables as DashboardOrder[];
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
    const supabase = await createClient();

    // Map UI status (Spanish) to DB status (English)
    const statusMap: Partial<Record<OrderStatus, string>> = {
        'pendiente': 'pending',
        'confirmado': 'confirmed',
        'preparando': 'preparing',
        'listo': 'ready',          // Packing/Ready phase
        'en_camino': 'on_way',     // Updated to match DB: on_way
        'entregado': 'delivered',
        'cancelado': 'cancelled'
    }

    const englishStatus = statusMap[status] || status;

    // Try updating with the English status first
    let { error } = await supabase
        .from("orders")
        .update({ status: englishStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId);

    // If English failed, try the original Spanish status (fallback)
    if (error) {
        console.warn(`Failed to update with status '${englishStatus}', trying fallback '${status}'...`);
        const { error: fallbackError } = await supabase
            .from("orders")
            .update({ status: status, updated_at: new Date().toISOString() })
            .eq("id", orderId);

        if (fallbackError) {
            console.error("Error updating order status (both attempts failed):", fallbackError);
            return { success: false, error: fallbackError.message || error.message };
        }
    }

    // Also log to history if table exists (from schema check earlier)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await supabase
            .from('order_status_history')
            .insert({
                order_id: orderId,
                status: englishStatus, // Log the intended status
                changed_by: user.id
            })
            .select()
            .single()
            // Ignore error for history logging to prevent blocking the UI flow
            .then(({ error }) => {
                if (error) console.warn("Failed to log order history:", error)
            });
    }

    // Determine path to revalidate based on current status or general orders
    revalidatePath("/orders");
    revalidatePath("/"); // Update dashboard stats too
    return { success: true };
}
