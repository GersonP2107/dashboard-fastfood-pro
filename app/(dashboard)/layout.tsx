import { AppSidebar } from '@/components/AppSidebar'
import Header from '@/components/ui/Header'
import { getCurrentBusinessman } from '@/lib/actions/users'
import { BusinessChatHelper } from '@/components/ai/BusinessChatHelper'
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

    // Construct user object safely
    const userData = user ? {
        email: user.email,
        full_name: user.user_metadata?.full_name || business?.business_name, // Fallback to business name if no full_name
        avatar_url: user.user_metadata?.avatar_url
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
            {/* <BusinessChatHelper /> */}
        </SidebarProvider>
    )
}
