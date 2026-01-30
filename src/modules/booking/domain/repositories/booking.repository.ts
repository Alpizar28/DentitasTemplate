import { Booking } from '../entities/booking.entity';
import { TimeSlotRequest } from '../value-objects/time-slot-request.vo';
import { BookingActor } from '../value-objects/booking-actor.vo';
import { TimeRange } from '../value-objects/time-range.vo';

/**
 * Puerto primario para persistencia de reservas.
 * Desacopla el Dominio de la Infraestructura (Supabase/Postgres).
 */
export interface IBookingRepository {
    /**
     * Intenta crear un bloqueo temporal (HOLD) para una solicitud.
     * IMPORTANTE: Este método debe manejar la transaccionalidad de "Lazy Cleanup" implícita en la DB.
     * Si la DB lanza error de EXCLUDE, este método debe retornar error de dominio (OverlapError).
     * 
     * @param request El VO con resourceId y periodo.
     * @param actor Quién realiza la reserva.
     * @param holdExpiresAt Cuándo expira el bloqueo.
     * @returns La entidad Booking creada en estado HELD.
     */
    createHold(
        request: TimeSlotRequest,
        actor: BookingActor,
        holdExpiresAt: Date
    ): Promise<Booking>;

    /**
     * Confirma una reserva existente (HELD -> CONFIRMED).
     * Valida existencia y estado actual.
     */
    confirm(bookingId: string): Promise<void>;

    /**
     * Cancela una reserva (Soft Delete lógico).
     * Libera el slot para futuras reservas.
     */
    cancel(bookingId: string, reason: string): Promise<void>;

    /**
     * Busca si existen conflictos físicos para un rango dado.
     * Útil para pre-validación visual, aunque la DB es la autoridad final.
     * Retorna true si hay overlaps (HELD o CONFIRMED).
     */
    hasConflicts(resourceId: string, period: TimeRange): Promise<boolean>;

    /**
     * Recupera una reserva por ID.
     * Retorna null si no existe.
     */
    findById(bookingId: string): Promise<Booking | null>;
}
