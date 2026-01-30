import { Booking } from '../../domain/entities/booking.entity';
import { TimeRange } from '../../domain/value-objects/time-range.vo';
import { BookingActor } from '../../domain/value-objects/booking-actor.vo';
import { BookingStatus } from '../../domain/value-objects/booking-status.vo';

export class BookingMapper {
    static toDomain(row: any): Booking {
        // Row is expected to have standard snake_case columns
        // period is returned by Supabase as string "[start,end)" or similar range, OR parsed JSON if configured?
        // Postgres tstzrange usually comes as string in JS client unless transformed.

        // Parse Period Range string "[2024-01-01 10:00, 2024-01-01 11:00)"
        // Basic clean or simple extraction. Note: Postgres ISO format.
        const period = this.parsePostgresRange(row.period);

        return new Booking({
            id: row.id,
            resourceId: row.resource_id,
            period: period,
            status: row.status as BookingStatus, // Ensure valid enum cast in real app
            holdExpiresAt: row.hold_expires_at ? new Date(row.hold_expires_at) : null,
            actor: BookingActor.fromJSON(row.booked_by),
            serviceRef: row.service_ref,
            metadata: row.metadata,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        });
    }

    // Primitive parser for Postgres Range Types
    // Example: "[2024-01-01 10:00:00+00,2024-01-01 11:00:00+00)"
    private static parsePostgresRange(rangeStr: string): TimeRange {
        // Remove brackets/parenthesis
        const cleaned = rangeStr.replace(/[\[\]\(\)]/g, '');
        const [start, end] = cleaned.split(',');

        // Removing quotes that postgres sometimes adds
        const cleanStart = start.replace(/"/g, '');
        const cleanEnd = end.replace(/"/g, '');

        return TimeRange.fromISO(cleanStart, cleanEnd);
    }
}
