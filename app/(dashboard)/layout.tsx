import { AppSidebar } from '@/components/AppSidebar'
import Header from '@/components/ui/Header'
import { getCurrentBusinessman } from '@/lib/actions/users'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/server'
import { RoleName } from '@/lib/types'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const [business, { data: { user } }] = await Promise.all([
        getCurrentBusinessman(),
        supabase.auth.getUser(),
    ])

    // ── Read profile (source of truth for avatar/name) ──
    let profileData: { full_name: string | null; avatar_url: string | null } | null = null
    if (user) {
        const { data } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .single()
        profileData = data
    }

    // ── Determine role ──────────────────────────────────
    // If user owns a business → they are effectively 'admin' (owner)
    // Otherwise → look up their role in user_roles
    let userRole: RoleName | null = null

    if (business) {
        // Owner of the business: always admin-level
        userRole = 'admin'
    } else if (user) {
        // Team member: look up their assigned role
        const { data: memberRole } = await supabase
            .from('user_roles')
            .select('role:roles(name)')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single()

        if (memberRole) {
            userRole = (memberRole.role as unknown as { name: RoleName })?.name ?? null
        }
    }

    const userData = user
        ? {
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
        }
        : null

    return (
        <SidebarProvider>
            <AppSidebar business={business} user={userData} userRole={userRole} isOwner={!!business} />
            <SidebarInset>
                <Header business={business} />
                <main className="flex-1 overflow-y-auto py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-zinc-950 w-full">
                    <div className="max-w-[1600px] mx-auto">{children}</div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
