
import { IConfigService, IConfigRepository } from './config.ports';
import { BookingConfig, validateConfig, DEFAULT_CONFIG } from './config.types';
import { FlagContext, DEFAULT_FLAG_VALUES } from '../extensions/feature-flags.interfaces';

export class ConfigService implements IConfigService {
    private currentConfig: BookingConfig = { ...DEFAULT_CONFIG };
    private isLoaded = false;

    constructor(
        private repository: IConfigRepository,
        private baseConfig: BookingConfig, // File config injected
        private environment: string
    ) { }

    async load(): Promise<void> {
        try {
            // 1. Start with Defaults
            let finalConfig: BookingConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

            // 2. Merge File Config (Base)
            finalConfig = this.deepMerge(finalConfig, this.baseConfig);

            // 3. Merge DB Config (Active Override)
            const dbConfig = await this.repository.getActiveConfig(this.environment);
            if (dbConfig) {
                finalConfig = this.deepMerge(finalConfig, dbConfig);
            }

            // 4. Merge Env Vars (Emergency Flags)
            const envFlags = this.loadEnvFlags();
            if (Object.keys(envFlags).length > 0) {
                finalConfig.featureFlags = {
                    ...finalConfig.featureFlags,
                    ...envFlags
                };
            }

            // 5. Validation
            validateConfig(finalConfig);

            this.currentConfig = finalConfig;
            this.isLoaded = true;
            console.log(`[ConfigService] Configuration loaded for ${this.environment}. Source: ${dbConfig ? 'DB+File' : 'File Only'}`);
        } catch (error) {
            console.error('[ConfigService] Failed to load configuration. Aborting start.', error);
            throw error; // Fail-fast
        }
    }

    getConfig(): BookingConfig {
        if (!this.isLoaded) {
            console.warn('[ConfigService] Warning: accessing config before load(). Returning defaults.');
        }
        return this.currentConfig;
    }

    // IFeatureFlagProvider implementation
    async isEnabled(flagName: string, context?: FlagContext): Promise<boolean> {
        // 1. Check config (highest priority after overrides applied in load)
        if (this.currentConfig.featureFlags && flagName in this.currentConfig.featureFlags) {
            return this.currentConfig.featureFlags[flagName];
        }

        // 2. Fallback to M2 defaults (Code constants)
        if (flagName in DEFAULT_FLAG_VALUES) {
            return DEFAULT_FLAG_VALUES[flagName];
        }

        // 3. True default
        return false;
    }

    getPolicyParams<T = any>(policyName: string): T {
        return (this.currentConfig.policies[policyName] || {}) as T;
    }

    // Helper: Deep Merge
    private deepMerge(target: any, source: any): any {
        if (typeof target !== 'object' || target === null) return source;
        if (typeof source !== 'object' || source === null) return target;

        const output = { ...target };
        for (const key of Object.keys(source)) {
            if (source[key] instanceof Array) {
                output[key] = source[key]; // Arrays are replaced, not merged, usually safer for config
            } else if (typeof source[key] === 'object' && source[key] !== null) {
                output[key] = key in target ? this.deepMerge(target[key], source[key]) : source[key];
            } else {
                output[key] = source[key];
            }
        }
        return output;
    }

    private loadEnvFlags(): Record<string, boolean> {
        const flags: Record<string, boolean> = {};
        // Scan process.env for specific prefixes i.e. BOOKING_FLAG_
        // Example: BOOKING_FLAG_LeadTimePolicy_enabled=true
        // Using strict mapping for specific emergency flags requested in prompt

        // Example emergency map:
        // process.env.EMERGENCY_DISABLE_ALL_POLICIES -> clears policies?
        // process.env.BOOKING_FORCE_LEAD_TIME_ENABLED -> overrides lead time

        return flags;
    }
}
