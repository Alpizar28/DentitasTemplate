import { IFeatureFlagProvider, DEFAULT_FLAG_VALUES } from './feature-flags.interfaces';

/**
 * Implementación temporal basada en variables de entorno.
 * Formato esperado en .env:
 * NEXT_PUBLIC_FF_BOOKING_POLICIES_LEAD_TIME_ENABLED=true
 * 
 * Mapeo: 
 * booking.policies.lead_time.enabled -> NEXT_PUBLIC_FF_BOOKING_POLICIES_LEAD_TIME_ENABLED
 */
export class EnvFeatureFlagProvider implements IFeatureFlagProvider {

    async isEnabled(flagName: string, context?: any): Promise<boolean> {
        // 1. Check Env Var
        const envKey = this.toEnvKey(flagName);
        const envValue = process.env[envKey];

        if (envValue !== undefined) {
            return envValue.toLowerCase() === 'true';
        }

        // 2. Fallback to Default
        return DEFAULT_FLAG_VALUES[flagName] ?? false; // Default safe is false for unknown, explicit for known
    }

    private toEnvKey(flagName: string): string {
        // booking.policies.lead_time.enabled -> BOOKING_POLICIES_LEAD_TIME_ENABLED
        const upper = flagName.toUpperCase().replace(/\./g, '_');
        return `NEXT_PUBLIC_FF_${upper}`;
    }
}
