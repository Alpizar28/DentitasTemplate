
"use client"

import * as React from "react"
import { useBookingStore } from '@/modules/booking/application/store/booking.store'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { bookingSchema, BookingSchemaType } from "@/modules/booking/application/schemas/booking.schema"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/ui-core/form"
import { Input } from "@/ui-core/input"
import { Button } from "@/ui-core/button"
import { ChevronRight, ChevronsUpDown } from "lucide-react"
import { motion } from "framer-motion"

// Simplified Country List - Optimized for "Local Business" context
const COUNTRIES = [
    { code: "PA", dial: "+507", flag: "🇵🇦", name: "Panamá" },
    { code: "CR", dial: "+506", flag: "🇨🇷", name: "Costa Rica" },
    { code: "CO", dial: "+57", flag: "🇨🇴", name: "Colombia" },
    { code: "MX", dial: "+52", flag: "🇲🇽", name: "México" },
    { code: "ES", dial: "+34", flag: "🇪🇸", name: "España" },
    { code: "US", dial: "+1", flag: "🇺🇸", name: "Estados Unidos" },
]

export function PatientDetails() {
    const { setPatientDetails, patientDetails, setStep } = useBookingStore()

    // Infer default country or phone split
    const defaultPhoneRaw = patientDetails.phone || "";
    let defaultCountry = "+507"; // Default Panama
    let defaultNumber = defaultPhoneRaw;

    // Try to find matching prefix if exists
    const matchedCountry = COUNTRIES.find(c => defaultPhoneRaw.startsWith(c.dial));
    if (matchedCountry) {
        defaultCountry = matchedCountry.dial;
        defaultNumber = defaultPhoneRaw.replace(matchedCountry.dial, "").trim();
    }

    const form = useForm<BookingSchemaType>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            firstName: patientDetails.name ? patientDetails.name.split(' ')[0] : "",
            lastName: patientDetails.name ? patientDetails.name.split(' ').slice(1).join(' ') : "",
            email: patientDetails.email || "",
            countryCode: defaultCountry,
            phone: defaultNumber,
            notes: "",
        },
        mode: "onBlur" // Validate on blur for better UX
    })

    function onSubmit(data: BookingSchemaType) {
        const fullPhone = `${data.countryCode} ${data.phone}`;

        setPatientDetails({
            name: `${data.firstName} ${data.lastName}`.trim(),
            email: data.email,
            phone: fullPhone,
        })

        setStep('CONFIRMATION')
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-md mx-auto space-y-8"
        >
            <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Tus Datos de Contacto</h2>
                <p className="text-neutral-500 text-sm">Para enviarte la confirmación de tu cita.</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                    {/* Name Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Juan" {...field} autoComplete="given-name" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Apellido</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Pérez" {...field} autoComplete="family-name" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Email */}
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Correo Electrónico</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="nombre@ejemplo.com" {...field} autoComplete="email" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Phone with Country Selector */}
                    <div className="space-y-2">
                        <FormLabel>Teléfono Celular / WhatsApp</FormLabel>
                        <div className="flex gap-2 items-start">

                            {/* Country Select (Custom small select) */}
                            <FormField
                                control={form.control}
                                name="countryCode"
                                render={({ field }) => (
                                    <FormItem className="w-[110px] space-y-0">
                                        <FormControl>
                                            <div className="relative">
                                                <select
                                                    {...field}
                                                    className="w-full h-12 appearance-none rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                                                >
                                                    {COUNTRIES.map((c) => (
                                                        <option key={c.code} value={c.dial}>
                                                            {c.flag} {c.dial}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronsUpDown className="absolute right-2 top-3.5 h-4 w-4 opacity-50 pointer-events-none" />
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {/* Phone Number Input */}
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem className="flex-1 space-y-0">
                                        <FormControl>
                                            <Input
                                                type="tel"
                                                placeholder="6000-0000"
                                                {...field}
                                                autoComplete="tel"
                                                className="relative z-10"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        {form.formState.errors.countryCode && (
                            <p className="text-xs font-medium text-red-500">{form.formState.errors.countryCode.message}</p>
                        )}
                    </div>

                    {/* Notes (Optional) */}
                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Notas Opcionales</FormLabel>
                                <FormControl>
                                    <Input placeholder="Alguna alergia o detalle importante..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        className="w-full mt-8 py-6 text-lg rounded-full shadow-lg shadow-neutral-200/50 hover:shadow-xl hover:scale-[1.01] transition-all bg-neutral-900 text-white"
                        disabled={!form.formState.isValid && form.formState.isSubmitted} // Disable only if submitted and invalid? No, better let click and show errors.
                    >
                        Revisar y Confirmar <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>

                </form>
            </Form>
        </motion.div>
    )
}
