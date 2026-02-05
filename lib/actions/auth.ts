"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Businessman } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type RegistrationState = {
    success?: boolean;
    error?: string | null;
    step?: number;
};

export async function registerUser(prevState: RegistrationState, formData: FormData) {
    const supabase = await createClient();

    // Extract form data
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string; // Ideally used for user profile but auth metadata works too

    // Business Details
    const businessName = formData.get("businessName") as string;
    // Slug is automatically generated from businessName
    const phone = formData.get("phone") as string;
    const whatsapp = formData.get("whatsapp") as string;
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const department = formData.get("department") as string;
    const description = formData.get("description") as string;

    // Operations
    const deliveryTime = formData.get("deliveryTime") as string;
    const minOrderValue = parseFloat(formData.get("minOrderValue") as string || "0");
    const deliveryCost = parseFloat(formData.get("deliveryCost") as string || "0");

    let operatingSchedule: any[] = [];
    try {
        const scheduleJson = formData.get("operatingSchedule") as string;
        if (scheduleJson) {
            operatingSchedule = JSON.parse(scheduleJson);
        }
    } catch (e) {
        console.error("Error parsing operating schedule", e);
    }

    // 1. Sign Up User
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
        },
    });

    if (authError) {
        return { success: false, error: authError.message, step: 1 };
    }

    if (!authData.user) {
        return { success: false, error: "Something went wrong creating the user.", step: 1 };
    }

    // 2. Create Businessman Record

    // Construct new businessman object
    // Note: We are not handling file uploads (logo) here yet for simplicity, 
    // users can update logo in settings.

    const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newBusinessman: Partial<Businessman> = {
        user_id: authData.user.id,
        business_name: businessName,
        slug: slug,
        description: description,
        phone: phone,
        email: email, // Use auth email as contact email
        address: address,
        city: city,
        department: department,
        whatsapp_number: whatsapp, // Required
        operating_schedule: operatingSchedule,
        delivery_time_estimate: deliveryTime,
        min_order_value: minOrderValue,
        delivery_cost: deliveryCost,
        is_active: true,
        accept_orders: true,
    };

    const adminSupabase = await createAdminClient();

    const { data: createdBusiness, error: dbError } = await adminSupabase
        .from("businessmans")
        .insert(newBusinessman)
        .select()
        .single();

    if (dbError) {
        // If db insert fails, ideally we should rollback auth user, 
        // but for now we will just return error. 
        // This is a known issue with dual-writes without transactions.
        // However, since uuid is used, retrying might be possible.
        return { success: false, error: "Created account but failed to set up business profile: " + dbError.message, step: 2 };
    }

    // 3. Create Default Payment Method (Efectivo)
    // We use adminSupabase here as well to ensure permissions, although user should be able to do it if RLS allows.
    // But since this is a system action on registration, admin is safer.
    if (createdBusiness) {
        await adminSupabase.from("payment_methods").insert({
            businessman_id: createdBusiness.id,
            type: 'efectivo',
            name: 'Efectivo',
            is_active: true
        });
    }

    // If successful
    revalidatePath("/");
    return { success: true, error: null };
}
