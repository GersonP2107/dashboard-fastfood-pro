import { AppSidebar } from '@/components/AppSidebar'
import Header from '@/components/ui/Header'
import { getCurrentBusinessman } from '@/lib/actions/users'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient();
    const [business, { data: { user } }] = await Promise.all([
        getCurrentBusinessman(),
        supabase.auth.getUser()
    ]);

    // Read profile from the profiles table (source of truth for avatar/name)
    let profileData: { full_name: string | null; avatar_url: string | null } | null = null
    if (user) {
        const { data } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .single()
        profileData = data
    }

    // Construct user object — profiles table takes priority over user_metadata fallback
    const userData = user ? {
        email: user.email,
        full_name:
            profileData?.full_name ||
            user.user_metadata?.full_name ||
            business?.business_name ||
            null,
        avatar_url:
            profileData?.avatar_url ||
            user.user_metadata?.avatar_url ||
            null,
    } : null;

    return (
        <SidebarProvider>
            <AppSidebar business={business} user={userData} />
            <SidebarInset>
                <Header business={business} />
                <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-zinc-950 overflow-y-auto w-full">
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
