
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
                    cookiesToSet.forEach(({ name, value, options }) => {
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

    const pathname = request.nextUrl.pathname;

    // ── Define public routes that DON'T require authentication ──
    const publicRoutes = ['/login', '/register', '/auth', '/api', '/checkout', '/driver'];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    // ── 1. No user on a protected route → redirect to login ──
    if (!user && !isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // ── 2. Authenticated user on a protected (dashboard) route ──
    if (user && !isPublicRoute) {
        // Check if the user has a business profile + subscription status
        const { data: businessman } = await supabase
            .from('businessmans')
            .select('subscription_status, trial_ends_at')
            .eq('user_id', user.id)
            .single()

        // 2a. No business profile at all → must complete registration
        if (!businessman) {
            if (!pathname.startsWith('/register')) {
                const url = request.nextUrl.clone()
                url.pathname = '/register'
                return NextResponse.redirect(url)
            }
            return response
        }

        // 2b. Subscription expired or canceled → check trial
        if (businessman.subscription_status === 'past_due' || businessman.subscription_status === 'canceled') {
            const trialActive = businessman.trial_ends_at && new Date(businessman.trial_ends_at) > new Date();

            if (!trialActive) {
                // No active trial and no active subscription → only allow billing
                if (pathname !== '/billing') {
                    const url = request.nextUrl.clone()
                    url.pathname = '/billing'
                    return NextResponse.redirect(url)
                }
            }
        }
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
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
