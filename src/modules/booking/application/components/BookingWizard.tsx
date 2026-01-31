
"use client"

import { useBookingStore } from '@/modules/booking/application/store/booking.store'
import { motion, AnimatePresence } from "framer-motion"
import { ServiceSelector } from './ServiceSelector'
import { DateSelector } from './DateSelector'
import { PatientDetails } from './PatientDetailsForm'
import { ConfirmationStep } from './ConfirmationStep'
import { Button } from "@/ui-core/button"
import { ArrowLeft, ChevronRight } from "lucide-react"

export function BookingWizard() {
    const { step, setStep, selectedDate, selectedTime, serviceId } = useBookingStore()

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
        <div className="mx-auto w-full max-w-4xl rounded-3xl bg-white shadow-xl shadow-neutral-100/50 p-6 md:p-12 min-h-[600px] flex flex-col font-sans border border-neutral-100">

            {/* Header / Progress (Simple Stepper) */}
            <div className="w-full mb-12 flex justify-center items-center text-xs font-medium tracking-widest uppercase text-neutral-400">
                <span className={step === 'SERVICE' ? "text-neutral-900 font-bold" : ""}>1. Servicio</span>
                <div className={`w-12 h-[1px] mx-4 transition-colors duration-300 ${step !== 'SERVICE' ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
                <span className={step === 'DATE' ? "text-neutral-900 font-bold" : ""}>2. Fecha y Hora</span>
                <div className={`w-12 h-[1px] mx-4 transition-colors duration-300 ${step === 'DETAILS' ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
                <span className={step === 'DETAILS' ? "text-neutral-900 font-bold" : ""}>3. Datos</span>
            </div>

            {/* Main Content Area with Animation */}
            <div className="flex-1 w-full max-w-3xl mx-auto relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {step === 'SERVICE' && (
                        <motion.div
                            key="step-service"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="w-full"
                        >
                            <ServiceSelector />
                        </motion.div>
                    )}
                    {step === 'DATE' && (
                        <motion.div
                            key="step-date"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="w-full"
                        >
                            <DateSelector />
                        </motion.div>
                    )}
                    {step === 'DETAILS' && (
                        <motion.div
                            key="step-details"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="w-full"
                        >
                            <PatientDetails />
                        </motion.div>
                    )}
                    {step === 'CONFIRMATION' && (
                        <motion.div
                            key="step-confirmation"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className="w-full"
                        >
                            <ConfirmationStep />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer Navigation (Hide on Confirmation Step) */}
            {step !== 'CONFIRMATION' && (
                <div className="w-full max-w-3xl mx-auto mt-12 flex justify-between items-center pt-6 border-t border-neutral-50">
                    {step !== 'SERVICE' ? (
                        <Button variant="ghost" onClick={goBack} className="text-neutral-500 hover:text-neutral-900 pl-0 hover:bg-transparent">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Atrás
                        </Button>
                    ) : <div />}

                    {step !== 'DETAILS' && (
                        <Button
                            disabled={!canAdvance()}
                            onClick={goNext}
                            className="rounded-full px-8 py-6 text-md shadow-lg shadow-neutral-200 disabled:opacity-50 disabled:shadow-none transition-all hover:scale-105 active:scale-95"
                        >
                            Siguiente
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </div>
            )}

        </div>
    )
}
