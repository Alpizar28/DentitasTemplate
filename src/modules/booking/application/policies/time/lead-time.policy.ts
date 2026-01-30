import { IPolicy } from '../policy.interfaces';
import { PolicyContext, PolicyResult, BookingCommandType } from '../policy.types';
import { differenceInMinutes } from 'date-fns'; // O cálculo manual si queremos 0 dependencias runtime

/**
 * Regla: Tiempo mínimo de anticipación.
 * Evita reservas "sorpresa" inmediatas.
 * 
 * Configurable por: minLeadMinutes
 */
export class LeadTimePolicy implements IPolicy {
    public readonly id = 'LeadTimePolicy@v1';
    public readonly order = 200; // Prioridad media (después de seguridad/bloqueos)

    constructor(private minLeadMinutes: number) {
        if (minLeadMinutes < 0) throw new Error('minLeadMinutes cannot be negative');
    }

    shouldApply(command: BookingCommandType, context: PolicyContext): boolean {
        // Solo aplica al intentar CREAR un bloqueo o REPROGRAMAR
        return (command === 'CREATE_HOLD' || command === 'RESCHEDULE') && !!context.request;
    }

    async evaluate(context: PolicyContext): Promise<PolicyResult> {
        const requestStart = context.request!.timeRange.start;
        const now = context.timeNow;

        // Calculamos diferencia en minutos
        const diffMs = requestStart.getTime() - now.getTime();
        const actualLeadMinutes = Math.floor(diffMs / (1000 * 60));

        if (actualLeadMinutes < this.minLeadMinutes) {
            return {
                status: 'DENY',
                policyId: this.id,
                reasonCode: 'booking.lead_time.too_soon',
                message: `Booking must be made at least ${this.minLeadMinutes} minutes in advance.`,
                actionDetails: {
                    minLeadMinutes: this.minLeadMinutes,
                    actualLeadMinutes: actualLeadMinutes
                }
            };
        }

        return {
            status: 'ALLOW',
            policyId: this.id
        };
    }
}
