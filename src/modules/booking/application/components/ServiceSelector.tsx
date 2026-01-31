
"use client"

import { useBookingStore } from '@/modules/booking/application/store/booking.store'
import { motion } from "framer-motion"
import { Check } from "lucide-react"

export function ServiceSelector() {
    const { selectService, serviceId } = useBookingStore()

    // This would come from DB/Config in real app
    const services = [
        {
            id: "srv-01",
            name: "Consulta General",
            duration: "30 min",
            price: "$50",
            description: "Revisión completa y diagnóstico inicial."
        },
        {
            id: "srv-02",
            name: "Limpieza Profunda",
            duration: "60 min",
            price: "$80",
            description: "Higiene dental avanzada con ultrasonido."
        },
        {
            id: "srv-03",
            name: "Blanqueamiento",
            duration: "90 min",
            price: "$200",
            description: "Tratamiento estético para una sonrisa brillante."
        }
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            <h2 className="text-2xl font-semibold tracking-tight">Elige el servicio</h2>
            <div className="grid gap-4 sm:grid-cols-2">
                {services.map((service) => (
                    <div
                        key={service.id}
                        onClick={() => selectService(service.id)}
                        className={`
              relative cursor-pointer rounded-xl border p-6 transition-all hover:shadow-md
              ${serviceId === service.id
                                ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900"
                                : "border-neutral-200 bg-white hover:border-neutral-300"
                            }
            `}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-lg">{service.name}</h3>
                            {serviceId === service.id && (
                                <div className="bg-neutral-900 text-white rounded-full p-1">
                                    <Check className="w-3 h-3" />
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-neutral-500 mb-4">{service.description}</p>
                        <div className="flex items-center justify-between text-sm font-medium">
                            <span className="bg-neutral-100 px-2 py-1 rounded text-neutral-600">{service.duration}</span>
                            <span>{service.price}</span>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    )
}
