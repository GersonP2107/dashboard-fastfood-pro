"use server";

import { createClient } from "@/lib/supabase/server";
import { PaymentMethod } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function getPaymentMethods(businessmanId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("businessman_id", businessmanId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error fetching payment methods:", error);
        return [];
    }

    return data as PaymentMethod[];
}

export async function createPaymentMethod(businessmanId: string, paymentMethod: Partial<PaymentMethod>) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("payment_methods")
        .insert({
            ...paymentMethod,
            businessman_id: businessmanId,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating payment method:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/settings");
    return { success: true, data };
}

export async function updatePaymentMethod(id: string, updates: Partial<PaymentMethod>) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("payment_methods")
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating payment method:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/settings");
    return { success: true, data };
}

export async function deletePaymentMethod(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting payment method:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/settings");
    return { success: true };
}
