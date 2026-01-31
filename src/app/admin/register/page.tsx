
'use client'

import { useActionState } from 'react'
import { register } from './actions'
import { Button } from '@/ui-core/button'
import { Input } from '@/ui-core/input'
import { Lock, Mail, Loader2, UserPlus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
    const [state, formAction, isPending] = useActionState(register, null)

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl ring-1 ring-gray-900/5">
                <div className="flex flex-col items-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                        <UserPlus className="h-8 w-8" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                        Crear Cuenta
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-500">
                        Regístrate para gestionar tu clínica
                    </p>
                </div>

                {state?.success ? (
                    <div className="mt-8 space-y-6">
                        <div className="rounded-lg bg-green-50 p-6 text-center text-sm font-medium text-green-700 ring-1 ring-green-100">
                            <p className="text-base mb-2">✅ ¡Registro casi listo!</p>
                            {state.success}
                        </div>
                        <Link href="/admin/login" className="flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver al inicio de sesión
                        </Link>
                    </div>
                ) : (
                    <form action={formAction} className="mt-8 space-y-6">
                        <div className="space-y-4">
                            <div className="relative">
                                <label htmlFor="email-address" className="sr-only">Correo Electrónico</label>
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <Input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                                    placeholder="usuario@admin.com"
                                />
                            </div>
                            <div className="relative">
                                <label htmlFor="password" className="sr-only">Contraseña</label>
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                                    placeholder="Nueva contraseña"
                                />
                            </div>
                            <div className="relative">
                                <label htmlFor="confirmPassword" className="sr-only">Confirmar Contraseña</label>
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                                    placeholder="Repite la contraseña"
                                />
                            </div>
                        </div>

                        {state?.error && (
                            <div className="rounded-lg bg-red-50 p-4 text-sm font-medium text-red-600 text-center animate-in fade-in slide-in-from-top-1 shadow-sm border border-red-100">
                                {state.error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="w-full h-12 text-base font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all bg-blue-600 hover:bg-blue-700"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Creando cuenta...
                                    </>
                                ) : (
                                    "Registrarse"
                                )}
                            </Button>

                            <div className="text-center">
                                <Link href="/admin/login" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
                                    ¿Ya tienes cuenta? <span className="text-blue-600">Inicia sesión</span>
                                </Link>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
