"use client"

import * as React from "react"
import {
    AudioWaveform,
    BookOpen,
    Bot,
    Command,
    Frame,
    GalleryVerticalEnd,
    Map,
    PieChart,
    Settings2,
    SquareTerminal,
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
    Sparkles,
    BadgeCheck,
    Bell,
    ChevronsUpDown,
    Plus,
    MoreHorizontal,
    Folder,
    Forward,
    Trash2
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
import { isTrialActive, getTrialDaysRemaining } from "@/lib/utils/trial"
import Link from "next/link"

// Define navigation items
const navigation = [
    { name: 'Panel', href: '/', icon: LayoutDashboard },
    { name: 'Ordenes', href: '/orders', icon: ListOrdered },
    { name: 'Historial', href: '/history', icon: History },
    { name: 'Productos', href: '/products', icon: ShoppingBag },
    { name: 'Categorías', href: '/categories', icon: Layers },
    { name: 'Inventario', href: '/inventory', icon: Package },
    { name: 'Finanzas', href: '/finance', icon: DollarSign },
    { name: 'Configuración', href: '/settings', icon: Settings },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    business?: {
        id: string;
        business_name: string;
        logo_url?: string;
        plan_type?: 'essential' | 'professional' | 'premium';
        trial_ends_at?: string | null;
        email?: string; // Should be passed if available, otherwise fallback
    } | null;
    user?: {
        email?: string;
        full_name?: string;
        avatar_url?: string;
    } | null;
}

export function AppSidebar({ business, user, ...props }: AppSidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    // Filter navigation based on plan
    const plan = business?.plan_type || 'essential';

    const filteredNavigation = navigation.filter(item => {
        if (plan === 'essential') {
            return !['Ordenes', 'Historial', 'Inventario', 'Finanzas'].includes(item.name);
        }
        if (plan === 'professional') {
            return !['Finanzas'].includes(item.name);
        }
        return true; // premium sees all
    });

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
    }

    const businessInitials = business?.business_name
        ? business.business_name.substring(0, 2).toUpperCase()
        : "FP"

    return (
        <Sidebar collapsible="icon" {...props} className="border-r-0">
            <SidebarHeader className="pb-4 pt-5">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-linear-to-br from-brand-primary to-brand-accent text-white shadow-lg shadow-brand-primary/20">
                                        {business?.logo_url ? (
                                            <Avatar className="size-10 rounded-xl border-2 border-white/20">
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
            <SidebarContent className="px-3">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest px-2 mb-2 mt-2">Plataforma</SidebarGroupLabel>
                    <SidebarMenu className="gap-1.5">
                        {filteredNavigation.map((item) => (
                            <SidebarMenuItem key={item.name}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={pathname === item.href}
                                    tooltip={item.name}
                                    className="h-auto py-3 px-3 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-zinc-800 data-[active=true]:bg-brand-primary data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-brand-primary/25 data-[active=true]:hover:bg-brand-primary/90"
                                >
                                    <Link href={item.href} className="flex items-center gap-3">
                                        <item.icon className="size-5 shrink-0" />
                                        <span className="font-medium text-[15px]">{item.name}</span>
                                    </Link>
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
                                        <AvatarImage src={user?.avatar_url} alt={user?.full_name || ''} />
                                        <AvatarFallback className="rounded-lg bg-gray-100 dark:bg-zinc-800 font-medium">
                                            <User className="size-4 text-muted-foreground" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left leading-tight ml-1">
                                        <span className="truncate font-semibold text-sm text-foreground">{user?.full_name || 'Usuario'}</span>
                                        <span className="truncate text-xs text-muted-foreground">{user?.email || ''}</span>
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
                                            <AvatarImage src={user?.avatar_url} alt={user?.full_name || ''} />
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
                                        <Link href="/settings">
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
