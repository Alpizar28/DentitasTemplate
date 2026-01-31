
import { SupabaseService } from '../../../../shared/infrastructure/supabase.client';
import { BookingInfrastructureHealthCheck } from './health-check';

async function run() {
    console.log('🏥 Running Booking Infrastructure Health Check...');

    // Ensure env vars are loaded (if running via tsx/dotenv)

    const client = SupabaseService.getClient();
    const checker = new BookingInfrastructureHealthCheck(client);

    const result = await checker.checkHealth();

    if (result.healthy) {
        console.log('✅ SYSTEM HEALTHY. All constraints and triggers are active.');
        process.exit(0);
    } else {
        console.error('❌ SYSTEM UNHEALTHY. Critical issues found:');
        result.issues.forEach(issue => console.error(`   - ${issue}`));
        process.exit(1);
    }
}

run().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
