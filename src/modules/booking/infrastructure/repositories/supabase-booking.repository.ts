import { SupabaseClient } from '@supabase/supabase-js';
import { IBookingRepository } from '../../domain/repositories/booking.repository';
import { Booking } from '../../domain/entities/booking.entity';
import { TimeSlotRequest } from '../../domain/value-objects/time-slot-request.vo';
import { BookingActor } from '../../domain/value-objects/booking-actor.vo';
import { TimeRange } from '../../domain/value-objects/time-range.vo';
import { BookingStatus } from '../../domain/value-objects/booking-status.vo';
import {
    OverlapError,
    BookingNotFoundError,
    ResourceNotFoundError,
    DomainError
} from '../../domain/errors/booking.errors';
import { BookingMapper } from '../mappers/booking.mapper';
import { SupabaseService } from '../../../../shared/infrastructure/supabase.client';

export class SupabaseBookingRepository implements IBookingRepository {
    private client: SupabaseClient;

    constructor(client: SupabaseClient | null = null) {
        this.client = client || SupabaseService.getClient();
    }

    async createHold(
        request: TimeSlotRequest,
        actor: BookingActor,
        holdExpiresAt: Date
    ): Promise<Booking> {
        const { data, error } = await this.client
            .from('bookings')
            .insert({
                resource_id: request.resourceId,
                period: request.timeRange.toString(), // Postgres tstzrange format implicit conversion
                status: BookingStatus.HELD,
                hold_expires_at: holdExpiresAt.toISOString(),
                booked_by: actor.toJSON(),
                metadata: { request_type: request.type } // Optional tracing
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23P01') { // Exclusion Violation
                throw new OverlapError(`Slot overlap detected for resource ${request.resourceId}`);
            }
            if (error.code === '23503') { // Foreign Key Violation (Resource ID)
                throw new ResourceNotFoundError(request.resourceId);
            }
            throw new DomainError(`Database Error: ${error.message}`);
        }

        return BookingMapper.toDomain(data);
    }

    async confirm(bookingId: string): Promise<void> {
        // We only update if status is HELD or PENDING (Strict FSM enforcement in DB too?)
        // Domain FSM rules says Pending/Held -> Confirmed.

        const { data, error } = await this.client
            .from('bookings')
            .update({
                status: BookingStatus.CONFIRMED,
                hold_expires_at: null, // Clear expiration on confirm
                updated_at: new Date().toISOString()
            })
            .eq('id', bookingId)
            // Optimistic concurrency safety: ensure correct previous state
            .in('status', [BookingStatus.HELD, BookingStatus.PENDING])
            .select()
            .single();

        if (error) {
            throw new DomainError(`Confirm Error: ${error.message}`);
        }

        // If no data returned, it means ID didn't match OR Status wasn't right
        // We need to differentiate to give good error
        if (!data) {
            // Check if exists
            const exists = await this.findById(bookingId);
            if (!exists) throw new BookingNotFoundError(bookingId);

            // Exists but invalid status
            throw new DomainError(`Cannot confirm booking ${bookingId}: Invalid state ${exists.status}`);
        }
    }

    async cancel(bookingId: string, reason: string): Promise<void> {
        const { data, error } = await this.client
            .from('bookings')
            .update({
                status: BookingStatus.CANCELLED,
                hold_expires_at: null,
                metadata: { cancellation_reason: reason }, // TODO: merge with existing jsonb?
                updated_at: new Date().toISOString()
            })
            .eq('id', bookingId)
            .select()
            .single();

        if (error) throw new DomainError(error.message);
        if (!data) throw new BookingNotFoundError(bookingId);
    }

    async hasConflicts(resourceId: string, period: TimeRange): Promise<boolean> {
        // "Peek" conflict check.
        // Query overlaps where status in (HELD, CONFIRMED) and (hold_expires > now OR status=CONFIRMED)
        // Actually, simple overlap logic suffices as the DB trigger handles expiration lazy cleanup.
        // So if the trigger hasn't run, a stale hold MIGHT still exist physically.
        // But for "visual" hasConflicts, we should act as if we are the user view.

        const { count, error } = await this.client
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .eq('resource_id', resourceId)
            .overlaps('period', period.toString())
            .in('status', [BookingStatus.HELD, BookingStatus.CONFIRMED])
            // Filter out physically present but logically dead holds
            .or(`status.eq.${BookingStatus.CONFIRMED},and(status.eq.${BookingStatus.HELD},hold_expires_at.gt.now())`);

        if (error) throw new DomainError(error.message);

        return (count || 0) > 0;
    }

    async findById(bookingId: string): Promise<Booking | null> {
        const { data, error } = await this.client
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .maybeSingle(); // maybeSingle returns null if not found instead of error

        if (error) throw new DomainError(error.message);
        if (!data) return null;

        return BookingMapper.toDomain(data);
    }

    async findActiveBookings(resourceId: string, period: TimeRange): Promise<Booking[]> {
        // Query overlapping HELD/CONFIRMED bookings, ensuring HELD are not expired.
        const { data, error } = await this.client
            .from('bookings')
            .select('*')
            .eq('resource_id', resourceId)
            .overlaps('period', period.toString())
            .in('status', [BookingStatus.HELD, BookingStatus.CONFIRMED])
            // "Active" defined as: CONFIRMED OR (HELD AND hold_expires > now)
            .or(`status.eq.${BookingStatus.CONFIRMED},and(status.eq.${BookingStatus.HELD},hold_expires_at.gt.now())`);

        if (error) throw new DomainError(error.message);
        if (!data) return [];

        return data.map(row => BookingMapper.toDomain(row));
    }
}
