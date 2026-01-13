"use server";

import { createClient } from "@supabase/supabase-js";
import { DashboardOrder } from "@/lib/types";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getDriverOrder(orderId: string) {
    noStore();
    // Use admin client to bypass RLS for public driver view
    const { data, error } = await supabaseAdmin
        .from("orders")
        .select(`
            *,
            order_items (
                quantity,
                product_name
            )
        `)
        .eq("id", orderId)
        .single();

    if (error) {
        console.error("Error fetching driver order:", error);
        return null;
    }

    return data as DashboardOrder;
}

export async function confirmDelivery(orderId: string) {
    const { error } = await supabaseAdmin
        .from("orders")
        .update({
            status: 'delivered',
            updated_at: new Date().toISOString()
        })
        .eq("id", orderId);

    if (error) {
        console.error("Error confirming delivery:", error);
        return { success: false, error: error.message };
    }

    // Capture history? 
    // Ideally yes, but 'changed_by' refers to 'auth.users'. 
    // Since driver is anon, we might skip the FK or inserting logic here unless we make 'changed_by' nullable.
    // For MVP, we skip logging to 'order_status_history' OR we rely on a DB trigger if exists.
    // Let's check status history manually later if needed. For now just update the order.

    revalidatePath(`/driver/${orderId}`);
    return { success: true };
}
