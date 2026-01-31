
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    // Create supabase client
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Avoid protecting static assets
    if (
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.includes('.') ||
        request.nextUrl.pathname === '/favicon.ico'
    ) {
        return supabaseResponse
    }

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Admin Route Protection
    if (request.nextUrl.pathname.startsWith('/admin')) {
        const publicAdminPaths = ['/admin/login', '/admin/register', '/admin/forgot-password', '/admin/update-password']
        const isPublicAdminPath = publicAdminPaths.some(path => request.nextUrl.pathname === path)

        // If user is trying to access a public admin page (login/register/forgot)
        if (isPublicAdminPath) {
            // If user is already logged in, redirect to dashboard
            if (user) {
                const url = request.nextUrl.clone()
                url.pathname = '/admin/dashboard'
                return NextResponse.redirect(url)
            }
            return supabaseResponse
        }

        // If user is accessing protected admin pages and is NOT logged in
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/admin/login'
            return NextResponse.redirect(url)
        }

        // Redirect /admin to /admin/dashboard
        if (request.nextUrl.pathname === '/admin') {
            const url = request.nextUrl.clone()
            url.pathname = '/admin/dashboard'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
