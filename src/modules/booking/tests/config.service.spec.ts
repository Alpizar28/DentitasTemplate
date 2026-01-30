/**
 * Módulo 3: ConfigService Unit Tests
 * 
 * Tests críticos:
 * 1. Merge precedence (Env > DB > File > Defaults)
 * 2. Validation fail-fast
 * 3. Policy params mapping
 * 4. Feature flag resolution
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigService } from '../application/configuration/config.service';
import { IConfigRepository } from '../application/configuration/config.ports';
import { BookingConfig, validateConfig, ConfigValidationError } from '../application/configuration/config.types';
import { BookingFlags } from '../application/extensions/feature-flags.interfaces';

// Fake Repository (No DB)
class FakeConfigRepository implements IConfigRepository {
    private store: Map<string, BookingConfig> = new Map();

    async getActiveConfig(environment: string): Promise<BookingConfig | null> {
        return this.store.get(environment) || null;
    }

    async upsertConfig(key: string, environment: string, config: BookingConfig): Promise<void> {
        this.store.set(environment, config);
    }

    // Test helper
    setMockConfig(env: string, config: BookingConfig) {
        this.store.set(env, config);
    }
}

describe('ConfigService - Merge Precedence', () => {
    let repository: FakeConfigRepository;
    const baseFileConfig: BookingConfig = {
        version: '1.0.0',
        featureFlags: {
            [BookingFlags.POLICIES.LEAD_TIME_ENABLED]: true
        },
        policies: {
            LeadTimePolicy: { minMinutes: 60 }
        }
    };

    beforeEach(() => {
        repository = new FakeConfigRepository();
    });

    it('should use DB config over file config when DB has override', async () => {
        // Arrange: DB overrides LeadTime to 120
        repository.setMockConfig('test', {
            version: '1.1.0',
            featureFlags: {},
            policies: {
                LeadTimePolicy: { minMinutes: 120 }
            }
        });

        const service = new ConfigService(repository, baseFileConfig, 'test');
        await service.load();

        // Act
        const params = service.getPolicyParams<{ minMinutes: number }>('LeadTimePolicy');

        // Assert
        expect(params.minMinutes).toBe(120); // DB wins
    });

    it('should fallback to file config when DB returns null', async () => {
        // Arrange: No DB config
        const service = new ConfigService(repository, baseFileConfig, 'test');
        await service.load();

        // Act
        const params = service.getPolicyParams<{ minMinutes: number }>('LeadTimePolicy');

        // Assert
        expect(params.minMinutes).toBe(60); // File default
    });

    it('should return empty object for missing policy params', async () => {
        const service = new ConfigService(repository, baseFileConfig, 'test');
        await service.load();

        const params = service.getPolicyParams('NonExistentPolicy');
        expect(params).toEqual({});
    });
});

describe('ConfigService - Validation', () => {
    it('should throw ConfigValidationError on invalid config structure', () => {
        expect(() => {
            validateConfig({ invalid: 'structure' });
        }).toThrow(ConfigValidationError);
    });

    it('should throw if version is missing', () => {
        expect(() => {
            validateConfig({
                featureFlags: {},
                policies: {}
            });
        }).toThrow('Missing or invalid "version"');
    });

    it('should accept valid config', () => {
        const validConfig = {
            version: '1.0.0',
            featureFlags: {},
            policies: {}
        };

        expect(() => validateConfig(validConfig)).not.toThrow();
    });
});

describe('ConfigService - Feature Flags', () => {
    let repository: FakeConfigRepository;

    beforeEach(() => {
        repository = new FakeConfigRepository();
    });

    it('should resolve feature flag from config', async () => {
        const config: BookingConfig = {
            version: '1.0.0',
            featureFlags: {
                [BookingFlags.POLICIES.LEAD_TIME_ENABLED]: false
            },
            policies: {}
        };

        const service = new ConfigService(repository, config, 'test');
        await service.load();

        const isEnabled = await service.isEnabled(BookingFlags.POLICIES.LEAD_TIME_ENABLED);
        expect(isEnabled).toBe(false);
    });

    it('should fallback to M2 defaults for unknown flags', async () => {
        const config: BookingConfig = {
            version: '1.0.0',
            featureFlags: {}, // Empty
            policies: {}
        };

        const service = new ConfigService(repository, config, 'test');
        await service.load();

        // M2 default for LEAD_TIME_ENABLED is true
        const isEnabled = await service.isEnabled(BookingFlags.POLICIES.LEAD_TIME_ENABLED);
        expect(isEnabled).toBe(true);
    });
});

describe('ConfigService - Policy Params Mapping', () => {
    it('should correctly map LeadTimePolicy params', async () => {
        const repository = new FakeConfigRepository();
        const config: BookingConfig = {
            version: '1.0.0',
            featureFlags: {},
            policies: {
                LeadTimePolicy: { minMinutes: 90 }
            }
        };

        const service = new ConfigService(repository, config, 'test');
        await service.load();

        const params = service.getPolicyParams<{ minMinutes: number }>('LeadTimePolicy');
        expect(params.minMinutes).toBe(90);
    });

    it('should correctly map MaxAdvanceBookingPolicy params', async () => {
        const repository = new FakeConfigRepository();
        const config: BookingConfig = {
            version: '1.0.0',
            featureFlags: {},
            policies: {
                MaxAdvanceBookingPolicy: { maxMinutes: 60 * 24 * 60 } // 60 days
            }
        };

        const service = new ConfigService(repository, config, 'test');
        await service.load();

        const params = service.getPolicyParams<{ maxMinutes: number }>('MaxAdvanceBookingPolicy');
        expect(params.maxMinutes).toBe(60 * 24 * 60);
    });
});
