import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { SupabaseBookingRepository } from '../infrastructure/repositories/supabase-booking.repository';
import { TimeSlotRequest } from '../domain/value-objects/time-slot-request.vo';
import { BookingActor } from '../domain/value-objects/booking-actor.vo';
import { OverlapError } from '../domain/errors/booking.errors';
import { BookingStatus } from '../domain/value-objects/booking-status.vo';

// Load envs
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || '.env.local' }); // Or .env.test. Using local for now as user likely has it setup

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Test requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

describe('Module 1: Core Booking Integration', () => {
    let supabase: SupabaseClient;
    let repo: SupabaseBookingRepository;
    let testResourceId: string;
    const TEST_ACTOR = BookingActor.create('SYSTEM', 'test-runner');

    beforeAll(async () => {
        supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        repo = new SupabaseBookingRepository(supabase);
    });

    // Setup: Create a fresh resource for this suite to avoid pollution
    beforeEach(async () => {
        // We create a new resource for each test to ensure isolation? 
        // Or we create one "Suite Resource" and clean up bookings?
        // Cleaning up bookings is faster than creating resources.

        // Create random resource
        const { data, error } = await supabase
            .from('resources')
            .insert({ name: `Test Resource ${Date.now()}` })
            .select('id')
            .single();

        if (error) throw error;
        testResourceId = data.id;
    });

    afterAll(async () => {
        // Optional: Delete test resources created?
        // Ideally yes, but depends on cascade rules.
    });

    // A) Overlap HELD vs HELD
    it('should reject overlapping HELD bookings (No-Overlap)', async () => {
        const range = {
            start: '2024-01-01T10:00:00Z',
            end: '2024-01-01T11:00:00Z'
        };

        // 1. First Hold
        const req1 = new TimeSlotRequest({
            resourceId: testResourceId,
            start: range.start,
            end: range.end,
            type: 'CUSTOMER_BOOKING'
        });
        const expiresAt = new Date(Date.now() + 60000); // 1 min future
        await repo.createHold(req1, TEST_ACTOR, expiresAt);

        // 2. Second Hold (Exact Overlap)
        const req2 = new TimeSlotRequest({
            resourceId: testResourceId,
            start: range.start,
            end: range.end,
            type: 'CUSTOMER_BOOKING'
        });

        // Expect Failure
        await expect(repo.createHold(req2, TEST_ACTOR, expiresAt))
            .rejects.toThrow(OverlapError);

        // Assert DB State
        const { count } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('resource_id', testResourceId)
            .eq('status', BookingStatus.HELD);

        expect(count).toBe(1);
    });

    // B) Overlap HELD vs CONFIRMED
    it('should reject overlapping HELD on CONFIRMED booking', async () => {
        const start = '2024-01-02T10:00:00Z';
        const end = '2024-01-02T11:00:00Z';
        const expiresAt = new Date(Date.now() + 60000);

        // 1. Create and Confirm
        const req = new TimeSlotRequest({ resourceId: testResourceId, start, end, type: 'CUSTOMER_BOOKING' });
        const booking = await repo.createHold(req, TEST_ACTOR, expiresAt);
        await repo.confirm(booking.id);

        // 2. Try overlapping Hold
        const req2 = new TimeSlotRequest({ resourceId: testResourceId, start: '2024-01-02T10:30:00Z', end: '2024-01-02T11:30:00Z', type: 'CUSTOMER_BOOKING' });

        await expect(repo.createHold(req2, TEST_ACTOR, expiresAt))
            .rejects.toThrow(OverlapError);
    });

    // C) Contiguity
    it('should allow contiguous bookings [10,11) and [11,12)', async () => {
        const expiresAt = new Date(Date.now() + 60000);

        // Slot 1: 10-11
        const req1 = new TimeSlotRequest({
            resourceId: testResourceId,
            start: '2024-01-03T10:00:00Z',
            end: '2024-01-03T11:00:00Z',
            type: 'CUSTOMER_BOOKING'
        });
        await repo.createHold(req1, TEST_ACTOR, expiresAt);

        // Slot 2: 11-12 (Starts exactly at 11)
        const req2 = new TimeSlotRequest({
            resourceId: testResourceId,
            start: '2024-01-03T11:00:00Z',
            end: '2024-01-03T12:00:00Z',
            type: 'CUSTOMER_BOOKING'
        });
        // Should succeed
        const booking2 = await repo.createHold(req2, TEST_ACTOR, expiresAt);
        expect(booking2).toBeDefined();
    });

    // D) Lazy Cleanup
    it('should automatically invalidate expired HELD bookings (Self-Healing)', async () => {
        const range = {
            start: '2024-01-04T10:00:00Z',
            end: '2024-01-04T11:00:00Z'
        };

        // 1. Manually insert EXPIRED hold
        const expiredDate = new Date(Date.now() - 10000); // 10 secs ago
        const { data: expiredBooking, error } = await supabase.from('bookings').insert({
            resource_id: testResourceId,
            period: `[${range.start}, ${range.end})`,
            status: BookingStatus.HELD,
            hold_expires_at: expiredDate.toISOString(),
            booked_by: TEST_ACTOR.toJSON()
        }).select().single();

        if (error) throw error;

        // 2. Try to reserve SAME slot
        const req = new TimeSlotRequest({
            resourceId: testResourceId,
            start: range.start,
            end: range.end,
            type: 'CUSTOMER_BOOKING'
        });

        const newExpiresAt = new Date(Date.now() + 60000);
        const newBooking = await repo.createHold(req, TEST_ACTOR, newExpiresAt);

        // Assertions
        expect(newBooking).toBeDefined();

        // Check old booking is now cancelled
        const { data: oldCheck } = await supabase
            .from('bookings')
            .select('status')
            .eq('id', expiredBooking.id)
            .single();

        expect(oldCheck.status).toBe(BookingStatus.CANCELLED);
    });

    // E) Concurrencia
    it('should handle concurrent insertions atomically', async () => {
        const range = {
            start: '2024-01-05T10:00:00Z',
            end: '2024-01-05T11:00:00Z'
        };
        const expiresAt = new Date(Date.now() + 60000);
        const req = new TimeSlotRequest({
            resourceId: testResourceId,
            start: range.start,
            end: range.end,
            type: 'CUSTOMER_BOOKING'
        });

        const p1 = repo.createHold(req, TEST_ACTOR, expiresAt);
        const p2 = repo.createHold(req, TEST_ACTOR, expiresAt);

        const results = await Promise.allSettled([p1, p2]);

        const fulfilled = results.filter(r => r.status === 'fulfilled');
        const rejected = results.filter(r => r.status === 'rejected');

        // Exactly one wins
        expect(fulfilled.length).toBe(1);
        expect(rejected.length).toBe(1);

        // Rejected reason should be Overlap
        const reason = (rejected[0] as PromiseRejectedResult).reason;
        expect(reason).toBeInstanceOf(OverlapError);
    });
});
