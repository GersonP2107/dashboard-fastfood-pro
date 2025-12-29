"use server";

import { createClient } from "@/lib/supabase/server";

// Define the return type for better type safety
interface BusinessData {
    id: string;
    business_name: string;
    logo_url?: string;
    is_active: boolean;
}

export async function getCurrentBusinessman(): Promise<BusinessData | null> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        console.log("getCurrentBusinessman: No session user found.");
        return null;
    }

    const { data, error } = await supabase
        .from("businessmans")
        .select("id, business_name, logo_url, is_active")
        .eq("user_id", user.id)
        .single();

    if (error || !data) {
        console.error("Error fetching businessman for user:", user.id, error);
        return null;
    }

    return data;
}
