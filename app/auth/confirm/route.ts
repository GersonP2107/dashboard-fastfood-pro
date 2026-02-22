import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const next = searchParams.get('next') ?? '/'

    const redirectTo = request.nextUrl.clone()

    if (token_hash && type) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options)
                        })
                    },
                },
            }
        )

        const { error } = await supabase.auth.verifyOtp({ type, token_hash })

        if (!error) {
            redirectTo.searchParams.delete('token_hash')
            redirectTo.searchParams.delete('type')
            redirectTo.searchParams.delete('next')

            // Recovery flow → let user set a new password
            if (type === 'recovery') {
                redirectTo.pathname = '/reset-password'
            } else {
                // Email confirmation → go to dashboard (or custom 'next')
                redirectTo.pathname = next
            }

            return NextResponse.redirect(redirectTo)
        }
    }

    // Something went wrong → redirect to error page
    redirectTo.pathname = '/auth/error'
    return NextResponse.redirect(redirectTo)
}
