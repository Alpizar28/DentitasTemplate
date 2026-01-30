import { IPolicy } from '../policies/policy.interfaces';
import { IFeatureFlagProvider, BookingFlags } from './feature-flags.interfaces';
import { IConfigService } from '../configuration/config.ports';
// Imports concretos de las policies
import { LeadTimePolicy } from '../policies/time/lead-time.policy';
import { MaxAdvanceBookingPolicy } from '../policies/time/max-advance.policy';

/**
 * Registry Pattern (Módulo 3: Config-Aware).
 * 
 * Responsabilidad: 
 * - Instanciar policies con parámetros dinámicos desde ConfigService.
 * - Filtrar policies activas según Feature Flags.
 * 
 * Principios:
 * - NO lee DB directamente.
 * - NO accede a process.env directamente.
 * - Policies permanecen puras (no conocen ConfigService).
 */
export class PolicyRegistry {
    constructor(private configService: IConfigService) { }

    /**
     * Retorna la lista filtrada de policies activas.
     * Este método se llama en tiempo de construcción del request (o cacheado).
     */
    async getActivePolicies(): Promise<IPolicy[]> {
        const policies: IPolicy[] = [];

        // 1. Lead Time Policy (M3: Config-Driven)
        if (await this.configService.isEnabled(BookingFlags.POLICIES.LEAD_TIME_ENABLED)) {
            const params = this.configService.getPolicyParams<{ minMinutes: number }>('LeadTimePolicy');
            const minMinutes = params?.minMinutes ?? 60; // Safe default if config missing

            policies.push(new LeadTimePolicy(minMinutes));
        }

        // 2. Max Advance Policy (M3: Config-Driven)
        if (await this.configService.isEnabled(BookingFlags.POLICIES.MAX_ADVANCE_ENABLED)) {
            const params = this.configService.getPolicyParams<{ maxMinutes: number }>('MaxAdvanceBookingPolicy');
            const maxMinutes = params?.maxMinutes ?? (30 * 24 * 60); // 30 days default

            policies.push(new MaxAdvanceBookingPolicy(maxMinutes));
        }

        return policies;
    }
}
