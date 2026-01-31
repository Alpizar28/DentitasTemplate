
'use server'

import { createClient } from '@/shared/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function updatePassword(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!password || !confirmPassword) {
        return { error: 'Por favor, completa todos los campos' }
    }

    if (password !== confirmPassword) {
        return { error: 'Las contraseñas no coinciden' }
    }

    const { error } = await supabase.auth.updateUser({
        password: password
    })

    if (error) {
        return { error: error.message }
    }

    redirect('/admin/login?message=Contraseña actualizada con éxito')
}
