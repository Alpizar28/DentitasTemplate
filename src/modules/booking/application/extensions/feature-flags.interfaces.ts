/**
 * Contexto mínimo para evaluar un flag. (Opcional)
 * Puede contener el actor o el recurso para rollout parcial.
 */
export interface FlagContext {
    resourceId?: string;
    actorId?: string;
}

/**
 * Proveedor de Feature Flags.
 * Debe ser rapidísimo y sin efectos secundarios.
 */
export interface IFeatureFlagProvider {
    /**
     * Evalúa si un feature/policy está activo.
     * @param flagName Identificador jerárquico del flag (ej: 'booking.policies.lead_time.enabled')
     * @param context Contexto opcional para segmentación (no usado en implementación básica)
     */
    isEnabled(flagName: string, context?: FlagContext): Promise<boolean>;
}

/**
 * Convención de Nombres de Flags (Constantes)
 * Centraliza los strings mágicos para evitar errores de tipeo.
 */
export const BookingFlags = {
    POLICIES: {
        LEAD_TIME_ENABLED: 'booking.policies.lead_time.enabled',   // Default: TRUE (Restrictivo)
        MAX_ADVANCE_ENABLED: 'booking.policies.max_advance.enabled' // Default: TRUE (Restrictivo)
    },
    CONFIRMATION: {
        MANUAL_ENABLED: 'booking.confirmation.manual.enabled'      // Default: FALSE
    },
    ADMIN: {
        BlOCK_ENABLED: 'booking.admin.block.enabled'               // Default: TRUE
    }
} as const;

/**
 * Defaults por seguridad.
 * Si el provider falla o no encuentra el key, usamos esto.
 * Principio: Ante la duda, las reglas restrictivas se aplican.
 */
export const DEFAULT_FLAG_VALUES: Record<string, boolean> = {
    [BookingFlags.POLICIES.LEAD_TIME_ENABLED]: true,
    [BookingFlags.POLICIES.MAX_ADVANCE_ENABLED]: true,
    [BookingFlags.CONFIRMATION.MANUAL_ENABLED]: false, // Auto-confirm es más simple
    [BookingFlags.ADMIN.BlOCK_ENABLED]: true
};
