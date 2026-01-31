
'use server'

import { createClient } from '@/shared/lib/supabase/server'

export async function resetPassword(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string

    if (!email) {
        return { error: 'Por favor, ingresa tu correo electrónico' }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/update-password`,
    })

    if (error) {
        return { error: error.message }
    }

    return { success: 'Se ha enviado un enlace de recuperación a tu correo electrónico.' }
}
