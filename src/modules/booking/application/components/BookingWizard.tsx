"use client"

import { useBookingStore } from '@/modules/booking/application/store/booking.store'
import { motion, AnimatePresence } from "framer-motion"
import { ServiceSelector } from './ServiceSelector'
import { DateSelector } from './DateSelector'
import { PatientDetails } from './PatientDetailsForm'
import { ConfirmationStep } from './ConfirmationStep'
import { Button } from "@/ui-core/button"
import { ArrowLeft, ChevronRight, Calendar, Clock, DollarSign, Stethoscope } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function BookingWizard() {
    const { step, setStep, selectedDate, selectedTime, serviceId } = useBookingStore()

    // Mock data lookup (would be real dataStore in prod)
    const services = {
        "srv-01": { name: "Consulta General", price: "$50" },
        "srv-02": { name: "Limpieza Profunda", price: "$80" },
        "srv-03": { name: "Blanqueamiento", price: "$200" }
    }
    const currentService = serviceId ? services[serviceId as keyof typeof services] : null

    const canAdvance = () => {
        if (step === 'SERVICE') return !!serviceId
        if (step === 'DATE') return !!selectedDate && !!selectedTime
        return false
    }

    const goNext = () => {
        if (step === 'SERVICE') setStep('DATE')
        else if (step === 'DATE') setStep('DETAILS')
    }

    const goBack = () => {
        if (step === 'DATE') setStep('SERVICE')
        else if (step === 'DETAILS') setStep('DATE')
    }

    return (
        <div className="mx-auto w-full max-w-6xl flex flex-col lg:flex-row gap-8 font-sans">

            {/* Main Wizard Area */}
            <div className="flex-1 rounded-3xl bg-white shadow-xl shadow-neutral-100/50 p-6 md:p-12 min-h-[600px] flex flex-col border border-neutral-100 order-2 lg:order-1">

                {/* Stepper Header */}
                <div className="w-full mb-12 flex justify-center items-center text-xs font-medium tracking-widest uppercase text-neutral-400">
                    <span className={step === 'SERVICE' ? "text-neutral-900 font-bold" : ""}>1. Servicio</span>
                    <div className={`w-12 h-[1px] mx-4 transition-colors duration-300 ${step !== 'SERVICE' ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
                    <span className={step === 'DATE' ? "text-neutral-900 font-bold" : ""}>2. Fecha</span>
                    <div className={`w-12 h-[1px] mx-4 transition-colors duration-300 ${step === 'DETAILS' ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
                    <span className={step === 'DETAILS' ? "text-neutral-900 font-bold" : ""}>3. Datos</span>
                </div>

                {/* Wizard Steps */}
                <div className="flex-1 w-full max-w-3xl mx-auto relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {step === 'SERVICE' && (
                            <motion.div key="step-service" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="w-full">
                                <ServiceSelector />
                            </motion.div>
                        )}
                        {step === 'DATE' && (
                            <motion.div key="step-date" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full">
                                <DateSelector />
                            </motion.div>
                        )}
                        {step === 'DETAILS' && (
                            <motion.div key="step-details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full">
                                <PatientDetails />
                            </motion.div>
                        )}
                        {step === 'CONFIRMATION' && (
                            <motion.div key="step-confirmation" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
                                <ConfirmationStep />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Buttons */}
                {step !== 'CONFIRMATION' && (
                    <div className="w-full max-w-3xl mx-auto mt-12 flex justify-between items-center pt-6 border-t border-neutral-50">
                        {step !== 'SERVICE' ? (
                            <Button variant="ghost" onClick={goBack} className="text-neutral-500 hover:text-neutral-900 pl-0 hover:bg-transparent">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
                            </Button>
                        ) : <div />}

                        {step !== 'DETAILS' && (
                            <Button
                                disabled={!canAdvance()}
                                onClick={goNext}
                                className="rounded-full px-8 py-6 text-md shadow-lg shadow-neutral-200 disabled:opacity-50 disabled:shadow-none transition-all hover:scale-105 active:scale-95 bg-neutral-900 text-white hover:bg-neutral-800"
                            >
                                Siguiente <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Sidebar Summary (Desktop right, Mobile bottom or top) */}
            {step !== 'CONFIRMATION' && (
                <div className="w-full lg:w-80 order-1 lg:order-2">
                    <div className="sticky top-8 bg-white rounded-3xl border border-neutral-100 p-6 shadow-sm">
                        <h3 className="font-bold text-lg mb-6 border-b border-neutral-100 pb-4">Resumen de Cita</h3>

                        <div className="space-y-6">
                            <div className={`flex items-start gap-3 transition-opacity ${currentService ? 'opacity-100' : 'opacity-40'}`}>
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Stethoscope className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Servicio</p>
                                    <p className="font-medium text-neutral-900">{currentService ? currentService.name : "Seleccionar..."}</p>
                                </div>
                            </div>

                            <div className={`flex items-start gap-3 transition-opacity ${selectedDate ? 'opacity-100' : 'opacity-40'}`}>
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Calendar className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Fecha</p>
                                    <p className="font-medium text-neutral-900">
                                        {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: es }) : "Pendiente..."}
                                    </p>
                                </div>
                            </div>

                            <div className={`flex items-start gap-3 transition-opacity ${selectedTime ? 'opacity-100' : 'opacity-40'}`}>
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Clock className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Hora</p>
                                    <p className="font-medium text-neutral-900">{selectedTime || "Pendiente..."}</p>
                                </div>
                            </div>

                            {currentService && (
                                <div className="mt-8 pt-6 border-t border-neutral-100 flex justify-between items-center animate-in fade-in">
                                    <p className="text-sm text-neutral-500">Total Estimado</p>
                                    <p className="text-2xl font-bold text-neutral-900">{currentService.price}</p>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
