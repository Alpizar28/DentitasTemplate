import { BookingActor } from '../../../domain/value-objects/booking-actor.vo';
import { TimeSlotRequest } from '../../../domain/value-objects/time-slot-request.vo';
import { Booking } from '../../../domain/entities/booking.entity';

/**
 * Estados posibles resultantes de la evaluación de una política.
 * - ALLOW: La regla se cumplió o no aplica.
 * - DENY: La regla se violó estricamente. Bloquea el proceso.
 * - REQUIRE_ACTION: La regla se viola parcialmente pero permite continuidad bajo condición (ej. captcha, confirmar penalidad).
 */
export type PolicyStatus = 'ALLOW' | 'DENY' | 'REQUIRE_ACTION';

/**
 * Resultado estandarizado de una evaluación.
 * Audit-ready: contiene quién (policyId), qué pasó (status) y por qué (reasonCode).
 */
export interface PolicyResult {
    status: PolicyStatus;
    policyId: string;       // Identificador estable de la regla (ej: "LeadTime@v1")
    reasonCode?: string;    // Código estable para API clients (ej: "booking.lead_time.error")
    message?: string;       // Texto legible para humano opcional
    actionDetails?: Record<string, unknown>; // Datos extra si REQUIRE_ACTION (ej. { penaltyAmount: 50 })
}

/**
 * Comandos sobre los que puede operar una política.
 * Define el alcance de aplicación de la regla.
 */
export type BookingCommandType =
    | 'CREATE_HOLD'
    | 'CONFIRM'
    | 'CANCEL'
    | 'RESCHEDULE'
    | 'ADMIN_BLOCK';

/**
 * Contexto de Evaluación.
 * Contiene TODA la información necesaria para que una política decida, sin side-effects.
 * NO contiene acceso a DB directo.
 */
export interface PolicyContext {
    command: BookingCommandType;
    actor: BookingActor;

    // Datos de tiempo determinísticos (inyectados por IClock)
    timeNow: Date;

    // Payload: Puede ser un Request nuevo (Create) o un Booking existente (Cancel/Confirm)
    request?: TimeSlotRequest;
    bookingSnapshot?: Booking;

    // Metadata contextual flexible (ej. feature flags activos inyectados, config del recurso)
    metadata?: Record<string, unknown>;
}

/**
 * Traza de una ejecución completa de reglas.
 * Permite auditoría detallada de qué reglas corrieron y su resultado individual.
 */
export interface PolicyEvaluationRecord {
    policyId: string;
    order: number;
    result: PolicyResult;
    evaluatedAt: Date;
}

export interface PolicyTrace {
    command: BookingCommandType;
    overallStatus: PolicyStatus; // El resultado final agregado (si una falla, todo falla)
    records: PolicyEvaluationRecord[];
    timestamp: Date;
}
