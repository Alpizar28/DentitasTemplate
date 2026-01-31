'use client'

import { useState } from 'react'
import { Check, X, Clock, User, FileText, CheckCircle2, Calendar } from 'lucide-react'
import { Button } from '@/ui-core/button'
import { motion, AnimatePresence } from 'framer-motion'

// Mock Data Type
export type Appointment = {
    id: string
    time: string
    patient: string
    treatment: string
    status: 'pending' | 'confirmed' | 'cancelled'
    avatar?: string
}

export function AppointmentsTable({ appointments: initialAppointments }: { appointments: Appointment[] }) {
    const [appointments, setAppointments] = useState(initialAppointments)
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null)

    const handleAction = (id: string, newStatus: 'confirmed' | 'cancelled') => {
        setAppointments(prev => prev.map(apt =>
            apt.id === id ? { ...apt, status: newStatus } : apt
        ))

        const message = newStatus === 'confirmed' ? 'Cita confirmada con éxito' : 'Cita cancelada'
        setNotification({ message, type: 'success' })

        setTimeout(() => setNotification(null), 3000)
    }

    return (
        <div className="relative">
            {/* simple notification */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute -top-12 right-0 z-10 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white shadow-lg"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-medium">{notification.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-900/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500">
                        <thead className="bg-gray-50/75 text-xs uppercase text-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-semibold text-gray-900">Hora</th>
                                <th scope="col" className="px-6 py-4 font-semibold text-gray-900">Paciente</th>
                                <th scope="col" className="px-6 py-4 font-semibold text-gray-900">Tratamiento</th>
                                <th scope="col" className="px-6 py-4 font-semibold text-center text-gray-900">Estado</th>
                                <th scope="col" className="px-6 py-4 font-semibold text-right text-gray-900">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {appointments.map((apt) => (
                                <tr key={apt.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                                            {apt.time}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold border border-blue-100 ring-4 ring-white">
                                                {apt.patient.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">{apt.patient}</div>
                                                <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Paciente frecuente</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700 ring-1 ring-inset ring-neutral-200">
                                            {apt.treatment}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold leading-none ${apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                apt.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-rose-100 text-rose-700'
                                            }`}>
                                            {apt.status === 'confirmed' ? 'Confirmado' :
                                                apt.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 rounded-lg text-green-600 hover:bg-green-600 hover:text-white border-green-200 transition-all active:scale-95"
                                                onClick={() => handleAction(apt.id, 'confirmed')}
                                            >
                                                <Check className="h-4 w-4 mr-1" />
                                                Confirmar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 rounded-lg text-rose-600 hover:bg-rose-600 hover:text-white border-rose-200 transition-all active:scale-95"
                                                onClick={() => handleAction(apt.id, 'cancelled')}
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                Cancelar
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {appointments.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                        <div className="p-4 rounded-full bg-gray-50 mb-4 border border-gray-100">
                            <Calendar className="h-8 w-8 text-gray-300" />
                        </div>
                        <p className="font-medium">No hay citas programadas para hoy.</p>
                        <p className="text-xs text-gray-400 mt-1">Tu agenda está despejada por el momento.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
