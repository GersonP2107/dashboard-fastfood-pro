"use server";

import { createClient } from "@/lib/supabase/server";
import { Businessman } from "@/lib/types";

export async function getCurrentBusinessman(): Promise<Businessman | null> {
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
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (error || !data) {
        console.error("Error fetching businessman for user:", user.id, error);
        return null;
    }

    return data as Businessman;
}
