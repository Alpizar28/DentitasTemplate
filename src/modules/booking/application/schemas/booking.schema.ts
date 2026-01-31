
import { z } from "zod"

export const bookingSchema = z.object({
    firstName: z.string()
        .min(2, { message: "El nombre debe tener al menos 2 letras." })
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { message: "El nombre solo puede contener letras." }),

    lastName: z.string()
        .min(2, { message: "El apellido debe tener al menos 2 letras." })
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { message: "El apellido solo puede contener letras." }),

    email: z.string()
        .email({ message: "Por favor ingresa un email válido (ej. nombre@correo.com)." }),

    countryCode: z.string().min(1, { message: "Selecciona un país." }),

    phone: z.string()
        .min(6, { message: "El teléfono debe tener al menos 6 dígitos." })
        .max(15, { message: "El teléfono es demasiado largo." })
        .regex(/^[0-9]+$/, { message: "El teléfono solo puede contener números." }),

    notes: z.string().optional(),
})

export type BookingSchemaType = z.infer<typeof bookingSchema>
