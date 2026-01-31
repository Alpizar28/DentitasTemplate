
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

export interface ScheduleConfig {
    timezone: string;
    weeklyShifts: Array<{
        days: (number | string)[]; // 0=Sun or "MON"
        start: string;  // HH:mm
        end: string;    // HH:mm
    }>;
    globalBreaks: Array<{
        name: string;
        start: string;
        end: string;
        days: (number | string)[];
    }>;
    exceptions: Array<{
        date: string; // YYYY-MM-DD
        type: 'CLOSED' | 'MODIFIED' | 'BLACKOUT';
        start?: string;
        end?: string;
        reason?: string;
    }>;
}

export interface ServiceConfig {
    durationMinutes: number;
    granularityMinutes: number; // e.g., start every 15 mins
    bufferAfterMinutes?: number;
}

// Validation Helper
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

    // Optional: Validate SCHEDULE_DEFAULT if present
    if (config.policies.SCHEDULE_DEFAULT) {
        const sched = config.policies.SCHEDULE_DEFAULT;
        if (!Array.isArray(sched.weeklyShifts)) {
            throw new ConfigValidationError('SCHEDULE_DEFAULT.weeklyShifts must be an array');
        }
        if (!sched.timezone) {
            throw new ConfigValidationError('SCHEDULE_DEFAULT.timezone is required');
        }
    }

    return config as BookingConfig;
}
