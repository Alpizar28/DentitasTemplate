
import { SupabaseClient } from '@supabase/supabase-js';
import { IConfigRepository } from '../../application/configuration/config.ports';
import { BookingConfig } from '../../application/configuration/config.types';
import { SupabaseService } from '../../../../shared/infrastructure/supabase.client';

export class SupabaseConfigRepository implements IConfigRepository {
    private client: SupabaseClient;

    constructor(client: SupabaseClient | null = null) {
        this.client = client || SupabaseService.getClient();
    }

    async getActiveConfig(environment: string): Promise<BookingConfig | null> {
        const { data, error } = await this.client
            .from('app_config')
            .select('config_json')
            .eq('environment', environment)
            .eq('is_active', true)
            .eq('key', 'DEFAULT')
            .maybeSingle();

        if (error) {
            console.error('[SupabaseConfigRepository] Error fetching config:', error);
            // Fail-safe: null triggers fallback to file
            return null;
        }

        if (!data) return null;

        return data.config_json as BookingConfig;
    }

    async upsertConfig(key: string, environment: string, config: BookingConfig): Promise<void> {
        // We use onConflict to update if exists with same key/env/active
        const { error } = await this.client
            .from('app_config')
            .upsert({
                key: key,
                environment: environment,
                config_json: config,
                is_active: true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key, environment, is_active' });

        if (error) {
            throw new Error(`[SupabaseConfigRepository] Failed to upsert config: ${error.message}`);
        }
    }
}
