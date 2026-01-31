
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../../shared/infrastructure/supabase.client';

export class BookingInfrastructureHealthCheck {
    private client: SupabaseClient;

    constructor(client: SupabaseClient | null = null) {
        this.client = client || SupabaseService.getClient();
    }

    async checkHealth(): Promise<{ healthy: boolean; issues: string[] }> {
        const issues: string[] = [];

        try {
            // 1. Call RPC for Deep Inspection
            const { data, error } = await this.client.rpc('check_booking_infra_health');

            if (error) {
                // Warning: RPC might not exist if migration didn't run
                issues.push(`Health Check RPC failed (Migration missing?): ${error.message}`);

                // Fallback: Check table access
                const { error: tableError } = await this.client.from('bookings').select('id').limit(1);
                if (tableError) issues.push(`Table 'bookings' access failed: ${tableError.message}`);

            } else if (data) {
                // data is array of { check_name, passed, details }
                for (const check of (data as any[])) {
                    if (!check.passed) {
                        issues.push(`[CRITICAL] ${check.check_name} -> ${check.details}`);
                    }
                }
            } else {
                issues.push('Health Check returned no data.');
            }

        } catch (e: any) {
            issues.push(`Unexpected error during health check: ${e.message}`);
        }

        return {
            healthy: issues.length === 0,
            issues
        };
    }
}
