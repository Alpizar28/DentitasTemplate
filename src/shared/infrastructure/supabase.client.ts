import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Simple Singleton Wrapper to avoid multiple instances
// In a real app we might use Dependency Injection, but this suffices for the template.
export class SupabaseService {
    private static instance: SupabaseClient | null = null;

    static getClient(): SupabaseClient {
        if (!this.instance) {
            if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
                throw new Error('Missing Supabase Env Variables');
            }
            this.instance = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );
        }
        return this.instance;
    }
}
