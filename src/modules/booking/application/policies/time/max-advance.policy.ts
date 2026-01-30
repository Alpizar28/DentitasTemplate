import { IPolicy } from '../policy.interfaces';
import { PolicyContext, PolicyResult, BookingCommandType } from '../policy.types';

/**
 * Regla: Ventana Máxima de Anticipación.
 * Evita reservas demasiado lejanas en el futuro (ej. 2 años vista).
 * 
 * Configurable por: maxAdvanceMinutes
 */
export class MaxAdvanceBookingPolicy implements IPolicy {
    public readonly id = 'MaxAdvanceBookingPolicy@v1';
    public readonly order = 210; // Justo después de LeadTime

    constructor(private maxAdvanceMinutes: number) {
        if (maxAdvanceMinutes < 0) throw new Error('maxAdvanceMinutes cannot be negative');
    }

    shouldApply(command: BookingCommandType, context: PolicyContext): boolean {
        return (command === 'CREATE_HOLD' || command === 'RESCHEDULE') && !!context.request;
    }

    async evaluate(context: PolicyContext): Promise<PolicyResult> {
        const requestStart = context.request!.timeRange.start;
        const now = context.timeNow;

        const diffMs = requestStart.getTime() - now.getTime();
        const actualAdvanceMinutes = Math.floor(diffMs / (1000 * 60));

        // Si intenta reservar para el pasado o muy futuro
        // Nota: El pasado estricto podría manejarlo otra regla, pero max advance usualmente implica "future limit".
        // Si actualAdvance < 0 significa pasado, eso debería bloquearlo otra regla (ej. NoPastBooking), 
        // pero si esta regla solo cuida el techo superior, nos enfocamos en > max.

        if (actualAdvanceMinutes > this.maxAdvanceMinutes) {
            return {
                status: 'DENY',
                policyId: this.id,
                reasonCode: 'booking.max_advance.exceeded',
                message: `Cannot book more than ${this.maxAdvanceMinutes} minutes in advance.`,
                actionDetails: {
                    maxAdvanceMinutes: this.maxAdvanceMinutes,
                    actualAdvanceMinutes: actualAdvanceMinutes
                }
            };
        }

        return {
            status: 'ALLOW',
            policyId: this.id
        };
    }
}
