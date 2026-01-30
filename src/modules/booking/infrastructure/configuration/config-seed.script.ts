/**
 * Módulo 3: Configuration Seed Script
 * 
 * Responsabilidad:
 * - Leer seeds/base-config.json
 * - Validar contra BookingConfig schema
 * - Upsert idempotente a app_config table
 * 
 * Uso: node -r dotenv/config dist/modules/booking/infrastructure/configuration/config-seed.script.js
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { SupabaseConfigRepository } from './supabase-config.repository';
import { validateConfig, BookingConfig } from '../../application/configuration/config.types';

async function seedConfig() {
    console.log('[ConfigSeed] Starting configuration seed...');

    try {
        // 1. Read base config file
        const configPath = join(process.cwd(), 'seeds', 'base-config.json');
        console.log(`[ConfigSeed] Reading config from: ${configPath}`);

        const rawConfig = readFileSync(configPath, 'utf-8');
        const parsedConfig = JSON.parse(rawConfig);

        // 2. Validate schema
        console.log('[ConfigSeed] Validating configuration schema...');
        const validConfig: BookingConfig = validateConfig(parsedConfig);
        console.log(`[ConfigSeed] ✓ Configuration valid. Version: ${validConfig.version}`);

        // 3. Determine environment (from ENV or default to 'development')
        const environment = process.env.NODE_ENV || 'development';
        console.log(`[ConfigSeed] Target environment: ${environment}`);

        // 4. Upsert to database
        const repository = new SupabaseConfigRepository();
        console.log('[ConfigSeed] Upserting configuration to database...');

        await repository.upsertConfig('DEFAULT', environment, validConfig);

        console.log('[ConfigSeed] ✓ Configuration seeded successfully!');
        console.log(`[ConfigSeed] Key: DEFAULT, Environment: ${environment}`);

        process.exit(0);
    } catch (error) {
        console.error('[ConfigSeed] ✗ FAILED:', error);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    seedConfig();
}

export { seedConfig };
