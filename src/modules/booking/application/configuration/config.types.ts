
export interface BookingConfig {
    version: string;
    featureFlags: Record<string, boolean>;
    policies: Record<string, any>;
    business?: {
        timezone?: string;
        currency?: string;
    };
    meta?: {
        lastUpdated?: string;
        source?: 'FILE' | 'DB' | 'ENV' | 'MERGED';
    };
}

// Default safety fallback configuration
export const DEFAULT_CONFIG: BookingConfig = {
    version: '0.0.0',
    featureFlags: {},
    policies: {},
    business: {
        timezone: 'UTC',
        currency: 'USD'
    },
    meta: {
        source: 'FILE'
    }
};

export class ConfigValidationError extends Error {
    constructor(message: string) {
        super(`[ConfigValidation] ${message}`);
        this.name = 'ConfigValidationError';
    }
}

// Simple schema validator "Zod-like" but native
export function validateConfig(config: any): BookingConfig {
    if (!config || typeof config !== 'object') {
        throw new ConfigValidationError('Config root must be an object');
    }
    if (typeof config.version !== 'string') {
        throw new ConfigValidationError('Missing or invalid "version"');
    }
    if (!config.featureFlags || typeof config.featureFlags !== 'object') {
        throw new ConfigValidationError('Missing or invalid "featureFlags" object');
    }
    if (!config.policies || typeof config.policies !== 'object') {
        throw new ConfigValidationError('Missing or invalid "policies" object');
    }
    // Deep check policies values if needed, but keeping it generic for now is fine
    // as policies will validate their own params upon injection.

    return config as BookingConfig;
}
