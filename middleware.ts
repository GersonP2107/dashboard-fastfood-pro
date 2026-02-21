
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { RoleName, ROLE_PERMISSIONS } from '@/lib/types'

// ── Map each dashboard route to the required permission ──────────
const ROUTE_PERMISSIONS: Record<string, string> = {
    '/': 'view_dashboard',
    '/orders': 'view_orders',
    '/history': 'view_history',
    '/products': 'view_products',
    '/categories': 'view_categories',
    '/inventory': 'view_inventory',
    '/finance': 'view_finance',
    '/settings': 'view_settings',
    '/team': 'view_team',
    '/billing': 'view_billing',
    '/account': '', // always accessible to authenticated users
}

function roleHasPermission(role: RoleName | null, permission: string): boolean {
    if (!permission) return true // no restriction
    if (!role) return false
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => {
                        request.cookies.set(name, value)
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // ── Define public routes that DON'T require authentication ──
    const publicRoutes = ['/login', '/register', '/auth', '/api', '/checkout', '/driver']
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    // ── 1. No user on a protected route → redirect to login ──
    if (!user && !isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // ── 2. Authenticated user on a protected (dashboard) route ──
    if (user && !isPublicRoute) {
        // Check if the user has an owned business profile
        const { data: ownedBusiness } = await supabase
            .from('businessmans')
            .select('id, subscription_status, trial_ends_at, plan_type')
            .eq('user_id', user.id)
            .single()

        // 2a. Not the owner → check if they are a team member
        if (!ownedBusiness) {
            // Look for an active user_role for this user
            const { data: memberRole } = await supabase
                .from('user_roles')
                .select('businessman_id, status, role:roles(name)')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .single()

            if (!memberRole) {
                // No business at all → must complete registration
                if (!pathname.startsWith('/register')) {
                    const url = request.nextUrl.clone()
                    url.pathname = '/register'
                    return NextResponse.redirect(url)
                }
                return response
            }

            // Team member found — enforce route permissions
            const roleName = (memberRole.role as unknown as { name: RoleName })?.name ?? null
            const requiredPermission = ROUTE_PERMISSIONS[pathname] ?? ''

            if (requiredPermission && !roleHasPermission(roleName, requiredPermission)) {
                // Redirect to their "home" based on role
                const url = request.nextUrl.clone()
                url.pathname = roleName === 'cocinero' ? '/orders' : '/'
                return NextResponse.redirect(url)
            }

            return response
        }

        // 2b. Subscription expired or canceled → check trial
        if (
            ownedBusiness.subscription_status === 'past_due' ||
            ownedBusiness.subscription_status === 'canceled'
        ) {
            const trialActive =
                ownedBusiness.trial_ends_at &&
                new Date(ownedBusiness.trial_ends_at) > new Date()

            if (!trialActive) {
                if (pathname !== '/billing') {
                    const url = request.nextUrl.clone()
                    url.pathname = '/billing'
                    return NextResponse.redirect(url)
                }
            }
        }

        // 2c. Owner always has full access (skip permission check)
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
