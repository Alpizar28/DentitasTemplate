
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/shared/lib/supabase/server'

export async function register(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!email || !password || !confirmPassword) {
        return { error: 'Por favor, completa todos los campos' }
    }

    if (password !== confirmPassword) {
        return { error: 'Las contraseñas no coinciden' }
    }

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/login`,
        },
    })

    if (error) {
        return { error: error.message }
    }

    return { success: 'Cuenta creada. Por favor, revisa tu correo para confirmar tu registro.' }
}
