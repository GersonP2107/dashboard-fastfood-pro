"use client"

import * as React from "react"
import {
    LayoutDashboard,
    ListOrdered,
    History,
    ShoppingBag,
    Layers,
    Package,
    DollarSign,
    Settings,
    LogOut,
    Store,
    CreditCard,
    User,
    BadgeCheck,
    ChevronsUpDown,
    Users,
    ShieldCheck,
} from "lucide-react"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { isTrialActive } from "@/lib/utils/trial"
import Link from "next/link"
import { RoleName, ROLE_PERMISSIONS } from "@/lib/types"

// ── Navigation items with required permission ──────────────────────
const navigation = [
    { name: 'Panel', href: '/', icon: LayoutDashboard, permission: 'view_dashboard' },
    { name: 'Ordenes', href: '/orders', icon: ListOrdered, permission: 'view_orders' },
    { name: 'Historial', href: '/history', icon: History, permission: 'view_history' },
    { name: 'Productos', href: '/products', icon: ShoppingBag, permission: 'view_products' },
    { name: 'Categorías', href: '/categories', icon: Layers, permission: 'view_categories' },
    { name: 'Inventario', href: '/inventory', icon: Package, permission: 'view_inventory' },
    { name: 'Finanzas', href: '/finance', icon: DollarSign, permission: 'view_finance' },
    { name: 'Configuración', href: '/settings', icon: Settings, permission: 'view_settings' },
    { name: 'Equipo', href: '/team', icon: Users, permission: 'view_team' },
]

// ── Role display helpers ──────────────────────────────────────────
const ROLE_LABELS: Record<RoleName, string> = {
    admin: 'Admin',
    gerente: 'Gerente',
    empleado: 'Empleado',
    cocinero: 'Cocinero',
}
const ROLE_COLORS: Record<RoleName, string> = {
    admin: 'bg-brand-primary/15 text-brand-primary dark:text-brand-light',
    gerente: 'bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400',
    empleado: 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400',
    cocinero: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    business?: {
        id: string;
        business_name: string;
        logo_url?: string;
        plan_type?: 'essential' | 'professional' | 'premium';
        trial_ends_at?: string | null;
    } | null;
    user?: {
        email?: string;
        full_name?: string | null;
        avatar_url?: string | null;
    } | null;
    /** Role of the currently authenticated user in this business */
    userRole?: RoleName | null;
    /** True when the user owns the business (not a team member) */
    isOwner?: boolean;
}

export function AppSidebar({ business, user, userRole, isOwner = false, ...props }: AppSidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const plan = business?.plan_type || 'essential'

    const filteredNavigation = navigation.filter(item => {
        if (isOwner) {
            // ── Owner: restrict by subscription plan ──
            // essential → no Ordenes, Historial, Inventario, Finanzas, Equipo
            if (plan === 'essential' && ['Ordenes', 'Historial', 'Inventario', 'Finanzas', 'Equipo'].includes(item.name)) return false
            // professional → no Finanzas
            if (plan === 'professional' && ['Finanzas'].includes(item.name)) return false
            // premium → all items visible
        } else {
            // ── Team member: restrict by role permissions ──
            const rolePerms = userRole ? ROLE_PERMISSIONS[userRole] : []
            if (!rolePerms.includes(item.permission)) return false
        }
        return true
    })

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
    }

    const businessInitials = business?.business_name
        ? business.business_name.substring(0, 2).toUpperCase()
        : "FP"

    return (
        <Sidebar collapsible="icon" {...props} className="border-r-0">
            <SidebarHeader className="pb-4 pt-5 group-data-[collapsible=icon]:pb-3 group-data-[collapsible=icon]:pt-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-linear-to-br from-brand-primary to-brand-accent text-white shadow-lg shadow-brand-primary/20 ring-2 ring-brand-primary ring-offset-1 ring-offset-background">
                                        {business?.logo_url ? (
                                            <Avatar className="size-10 rounded-xl">
                                                <AvatarImage src={business.logo_url} alt={business.business_name} className="object-cover" />
                                                <AvatarFallback className="rounded-xl bg-transparent text-white font-bold">{businessInitials}</AvatarFallback>
                                            </Avatar>
                                        ) : (
                                            <Store className="size-5" />
                                        )}
                                    </div>
                                    <div className="grid flex-1 text-left leading-tight ml-1">
                                        <span className="truncate font-bold text-base text-gray-900 dark:text-white uppercase tracking-tight">{business?.business_name || 'FoodFast Pro'}</span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="truncate text-xs font-medium text-muted-foreground capitalize">{plan} Plan</span>
                                            {isTrialActive(business?.trial_ends_at) && (
                                                <span className="flex h-4 items-center justify-center rounded-full bg-emerald-500/15 px-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider relative top-px">
                                                    Trial
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronsUpDown className="ml-auto text-muted-foreground" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl shadow-xl border-border/50 bg-background/95 backdrop-blur-xs"
                                align="start"
                                side="bottom"
                                sideOffset={8}
                            >
                                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
                                    Negocio
                                </DropdownMenuLabel>
                                <DropdownMenuItem className="gap-3 p-3 focus:bg-accent cursor-pointer rounded-lg">
                                    <div className="flex size-8 items-center justify-center rounded-lg border bg-background text-brand-primary shadow-xs">
                                        <Store className="size-4" />
                                    </div>
                                    <div className="font-semibold text-foreground">
                                        {business?.business_name}
                                    </div>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className="px-3 group-data-[collapsible=icon]:px-0">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest px-2 mb-2 mt-2 group-data-[collapsible=icon]:hidden">Plataforma</SidebarGroupLabel>
                    <SidebarMenu className="gap-1.5">
                        {filteredNavigation.map((item) => (
                            <SidebarMenuItem key={item.name}>
                                <SidebarMenuButton
                                    isActive={pathname === item.href}
                                    tooltip={item.name}
                                    onClick={() => router.push(item.href)}
                                    className="rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-zinc-800 data-[active=true]:bg-brand-primary data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-brand-primary/25 data-[active=true]:hover:bg-brand-primary/90 group/nav-item [&>svg]:size-[18px]!"
                                >
                                    <item.icon className="shrink-0" />
                                    <span className="font-medium text-[15px]">{item.name}</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="pb-4 px-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors h-14"
                                >
                                    <Avatar className="h-9 w-9 rounded-lg border border-border/50">
                                        <AvatarImage src={user?.avatar_url ?? undefined} alt={user?.full_name || ''} />
                                        <AvatarFallback className="rounded-lg bg-gray-100 dark:bg-zinc-800 font-medium">
                                            <User className="size-4 text-muted-foreground" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left leading-tight ml-1">
                                        <span className="truncate font-semibold text-sm text-foreground">{user?.full_name || 'Usuario'}</span>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="truncate text-xs text-muted-foreground">{user?.email || ''}</span>
                                            {userRole && (
                                                <span className={`shrink-0 text-[10px] font-bold px-1.5 py-px rounded-full ${ROLE_COLORS[userRole]}`}>
                                                    {ROLE_LABELS[userRole]}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl shadow-xl border-border/50 bg-background/95 backdrop-blur-xs"
                                side="bottom"
                                align="end"
                                sideOffset={8}
                            >
                                <DropdownMenuLabel className="p-0 font-normal">
                                    <div className="flex items-center gap-3 px-3 py-3 text-left text-sm border-b border-border/50 bg-muted/20">
                                        <Avatar className="h-9 w-9 rounded-lg">
                                            <AvatarImage src={user?.avatar_url ?? undefined} alt={user?.full_name || ''} />
                                            <AvatarFallback className="rounded-lg">
                                                <User className="size-4" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left leading-tight">
                                            <span className="truncate font-semibold">{user?.full_name || 'Usuario'}</span>
                                            <span className="truncate text-xs text-muted-foreground">{user?.email || ''}</span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuGroup className="p-1">
                                    <DropdownMenuItem className="gap-2 px-3 py-2.5 rounded-lg focus:bg-accent cursor-pointer" asChild>
                                        <Link href="/account">
                                            <BadgeCheck className="size-4 text-muted-foreground" />
                                            <span>Cuenta</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="gap-2 px-3 py-2.5 rounded-lg focus:bg-accent cursor-pointer" asChild>
                                        <Link href="/billing">
                                            <CreditCard className="size-4 text-muted-foreground" />
                                            <span>Facturación</span>
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleSignOut} className="gap-2 px-3 py-2.5 m-1 rounded-lg focus:bg-red-50 dark:focus:bg-red-900/10 focus:text-red-600 dark:focus:text-red-400 cursor-pointer">
                                    <LogOut className="size-4" />
                                    <span>Cerrar sesión</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
