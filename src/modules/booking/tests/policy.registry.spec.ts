/**
 * Módulo 3: PolicyRegistry Integration Tests
 * 
 * Verificar que PolicyRegistry:
 * 1. Lee flags desde ConfigService
 * 2. Instancia policies con params correctos
 * 3. Aplica defaults seguros cuando falta config
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PolicyRegistry } from '../application/extensions/policy.registry';
import { IConfigService } from '../application/configuration/config.ports';
import { BookingConfig } from '../application/configuration/config.types';
import { BookingFlags } from '../application/extensions/feature-flags.interfaces';
import { LeadTimePolicy } from '../application/policies/time/lead-time.policy';
import { MaxAdvanceBookingPolicy } from '../application/policies/time/max-advance.policy';

// Fake ConfigService for testing
class FakeConfigService implements IConfigService {
    constructor(private config: BookingConfig) { }

    getConfig(): BookingConfig {
        return this.config;
    }

    async isEnabled(flagName: string): Promise<boolean> {
        return this.config.featureFlags[flagName] ?? false;
    }

    getPolicyParams<T = any>(policyName: string): T {
        return (this.config.policies[policyName] || {}) as T;
    }

    async load(): Promise<void> {
        // No-op for fake
    }
}

describe('PolicyRegistry - Config Integration', () => {
    it('should instantiate LeadTimePolicy with configured params', async () => {
        // Arrange
        const config: BookingConfig = {
            version: '1.0.0',
            featureFlags: {
                [BookingFlags.POLICIES.LEAD_TIME_ENABLED]: true
            },
            policies: {
                LeadTimePolicy: { minMinutes: 120 }
            }
        };

        const configService = new FakeConfigService(config);
        const registry = new PolicyRegistry(configService);

        // Act
        const policies = await registry.getActivePolicies();

        // Assert
        expect(policies).toHaveLength(1);
        expect(policies[0]).toBeInstanceOf(LeadTimePolicy);
        expect((policies[0] as LeadTimePolicy)['minLeadMinutes']).toBe(120);
    });

    it('should NOT instantiate policy when feature flag is disabled', async () => {
        // Arrange
        const config: BookingConfig = {
            version: '1.0.0',
            featureFlags: {
                [BookingFlags.POLICIES.LEAD_TIME_ENABLED]: false
            },
            policies: {
                LeadTimePolicy: { minMinutes: 60 }
            }
        };

        const configService = new FakeConfigService(config);
        const registry = new PolicyRegistry(configService);

        // Act
        const policies = await registry.getActivePolicies();

        // Assert
        expect(policies).toHaveLength(0);
    });

    it('should use safe defaults when policy params are missing', async () => {
        // Arrange: Flag enabled, but NO params configured
        const config: BookingConfig = {
            version: '1.0.0',
            featureFlags: {
                [BookingFlags.POLICIES.LEAD_TIME_ENABLED]: true
            },
            policies: {} // Empty!
        };

        const configService = new FakeConfigService(config);
        const registry = new PolicyRegistry(configService);

        // Act
        const policies = await registry.getActivePolicies();

        // Assert
        expect(policies).toHaveLength(1);
        expect(policies[0]).toBeInstanceOf(LeadTimePolicy);
        expect((policies[0] as LeadTimePolicy)['minLeadMinutes']).toBe(60); // Default
    });

    it('should instantiate multiple policies when all enabled', async () => {
        // Arrange
        const config: BookingConfig = {
            version: '1.0.0',
            featureFlags: {
                [BookingFlags.POLICIES.LEAD_TIME_ENABLED]: true,
                [BookingFlags.POLICIES.MAX_ADVANCE_ENABLED]: true
            },
            policies: {
                LeadTimePolicy: { minMinutes: 30 },
                MaxAdvanceBookingPolicy: { maxMinutes: 20160 } // 14 days
            }
        };

        const configService = new FakeConfigService(config);
        const registry = new PolicyRegistry(configService);

        // Act
        const policies = await registry.getActivePolicies();

        // Assert
        expect(policies).toHaveLength(2);
        expect(policies[0]).toBeInstanceOf(LeadTimePolicy);
        expect(policies[1]).toBeInstanceOf(MaxAdvanceBookingPolicy);
    });
});
