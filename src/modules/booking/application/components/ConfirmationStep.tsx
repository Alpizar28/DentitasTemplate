
"use client"

import * as React from "react"
import { useBookingStore } from '@/modules/booking/application/store/booking.store'
import { motion } from "framer-motion"
import { Button } from "@/ui-core/button"
import { createBookingAction } from "@/app/actions"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toPng } from "html-to-image"
import { CheckCircle2, Calendar, Clock, User, AlertCircle, Loader2, Download } from "lucide-react"
import Link from "next/link"

export function ConfirmationStep() {
    const { serviceId, selectedDate, selectedTime, patientDetails, setStep, reset } = useBookingStore()
    const [status, setStatus] = React.useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE')
    const [errorMessage, setErrorMessage] = React.useState('')
    const [bookingId, setBookingId] = React.useState('')
    const ticketRef = React.useRef<HTMLDivElement>(null)

    const handleConfirm = async () => {
        if (!serviceId || !selectedDate || !selectedTime || !patientDetails.email) {
            setErrorMessage("Faltan datos para confirmar la reserva.")
            setStatus('ERROR')
            return
        }

        setStatus('LOADING')
        setErrorMessage('')

        try {
            const result = await createBookingAction({
                serviceId,
                date: selectedDate,
                time: selectedTime,
                patient: {
                    name: patientDetails.name,
                    email: patientDetails.email,
                    phone: patientDetails.phone,
                }
            })

            if (result.success && result.bookingId) {
                setBookingId(result.bookingId)
                setStatus('SUCCESS')
            } else {
                setErrorMessage(result.error || "Error desconocido al procesar la reserva.")
                setStatus('ERROR')
            }
        } catch (error) {
            setErrorMessage("Error de conexión. Inténtalo de nuevo.")
            setStatus('ERROR')
        }
    }

    const downloadTicket = async () => {
        if (!ticketRef.current) return

        try {
            const dataUrl = await toPng(ticketRef.current, { cacheBust: true, backgroundColor: '#ffffff' })
            const link = document.createElement("a")
            link.download = `Reserva-${bookingId.slice(0, 8)}.png`
            link.href = dataUrl
            link.click()
        } catch (err) {
            console.error("Error generating ticket image", err)
        }
    }

    if (status === 'SUCCESS') {
        return (
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center space-y-6 py-6 text-center w-full max-w-md mx-auto"
            >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2 animate-in zoom-in spin-in-3">
                    <CheckCircle2 className="w-10 h-10" />
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-neutral-900">¡Reserva Confirmada!</h2>
                <p className="text-neutral-500 text-sm max-w-xs">
                    Hemos enviado los detalles a tu correo. Guarda este comprobante.
                </p>

                {/* Downloadable Ticket Card */}
                <div
                    ref={ticketRef}
                    className="w-full bg-white border border-neutral-200 rounded-2xl shadow-lg overflow-hidden text-left mt-4"
                >
                    <div className="bg-neutral-900 p-6 text-white">
                        <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">CITA CONFIRMADA</p>
                        <h3 className="text-xl font-semibold">Dentistas Template</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
                            <div>
                                <p className="text-xs text-neutral-400 font-medium uppercase">Fecha</p>
                                <p className="font-semibold text-neutral-900 text-lg capitalize">
                                    {selectedDate ? format(selectedDate, 'dd MMM yyyy', { locale: es }) : '-'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-neutral-400 font-medium uppercase">Hora</p>
                                <p className="font-semibold text-neutral-900 text-lg">
                                    {selectedTime}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
                            <div>
                                <p className="text-xs text-neutral-400 font-medium uppercase">Servicio</p>
                                <p className="font-medium text-neutral-900">Consulta General</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-neutral-400 font-medium uppercase">Paciente</p>
                            <p className="font-medium text-neutral-900">{patientDetails.name}</p>
                            <p className="text-xs text-neutral-500 mt-1">ID: {bookingId.slice(0, 8)}</p>
                        </div>
                    </div>
                    {/* Decorative barcode-like strip */}
                    <div className="h-4 bg-neutral-100 border-t border-dashed border-neutral-300 w-full" />
                </div>

                <div className="flex flex-col w-full space-y-3 pt-4">
                    <Button onClick={downloadTicket} className="w-full py-6 rounded-full shadow-md bg-neutral-900 text-white">
                        <Download className="w-4 h-4 mr-2" />
                        Descargar Comprobante
                    </Button>
                    <Link href="/" className="w-full">
                        <Button onClick={reset} variant="ghost" className="w-full">
                            Volver al Inicio
                        </Button>
                    </Link>
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg mx-auto space-y-8"
        >
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Revisa tu Reserva</h2>
                <p className="text-neutral-500">Por favor confirma que los datos sean correctos.</p>
            </div>

            {/* Ticket Card */}
            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden divide-y divide-neutral-100">
                {/* Header Service */}
                <div className="p-6 bg-neutral-50">
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">Servicio</p>
                    <h3 className="text-lg font-medium text-neutral-900">Consulta General / Limpieza</h3>
                </div>

                {/* Date & Time */}
                <div className="p-6 grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-neutral-400 font-medium">Fecha</p>
                            <p className="font-medium text-neutral-900 capitalize">
                                {selectedDate ? format(selectedDate, 'EEE dd MMM', { locale: es }) : '-'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-neutral-400 font-medium">Hora</p>
                            <p className="font-medium text-neutral-900">
                                {selectedTime || '-'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Patient Info */}
                <div className="p-6 flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <p className="text-xs text-neutral-400 font-medium">Paciente</p>
                        <p className="font-medium text-neutral-900">{patientDetails.name}</p>
                        <p className="text-sm text-neutral-500">{patientDetails.email}</p>
                        <p className="text-sm text-neutral-500">{patientDetails.phone}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setStep('DETAILS')} className="text-xs h-8">
                        Editar
                    </Button>
                </div>
            </div>

            {/* Error Message */}
            {status === 'ERROR' && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-start space-x-3 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium">Hubo un error</p>
                        <p>{errorMessage}</p>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-col space-y-3">
                <Button
                    onClick={handleConfirm}
                    disabled={status === 'LOADING'}
                    className="w-full py-6 text-lg rounded-full shadow-lg shadow-neutral-200 hover:shadow-xl hover:scale-[1.01] transition-all bg-neutral-900 text-white"
                >
                    {status === 'LOADING' ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Confirmando...
                        </>
                    ) : (
                        "Confirmar Cita"
                    )}
                </Button>

                <Button variant="ghost" disabled={status === 'LOADING'} onClick={() => setStep('DETAILS')} className="text-neutral-500">
                    Atrás
                </Button>
            </div>

        </motion.div>
    )
}
