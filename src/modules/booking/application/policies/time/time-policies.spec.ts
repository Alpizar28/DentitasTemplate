import { describe, it, expect } from 'vitest';
import { LeadTimePolicy } from './lead-time.policy';
import { MaxAdvanceBookingPolicy } from './max-advance.policy';
import { PolicyContext } from '../policy.types';
import { TimeSlotRequest } from '../../../../domain/value-objects/time-slot-request.vo';
import { BookingActor } from '../../../../domain/value-objects/booking-actor.vo';

// Helper to create valid context
const createTestContext = (requestStartIso: string, nowIso: string): PolicyContext => {
    return {
        command: 'CREATE_HOLD',
        actor: BookingActor.create('CUSTOMER', 'u1'),
        timeNow: new Date(nowIso),
        resourceId: 'r1',
        request: new TimeSlotRequest({
            resourceId: 'r1',
            start: requestStartIso,
            end: new Date(new Date(requestStartIso).getTime() + 60 * 60 * 1000).toISOString(), // 1h dur
            type: 'CUSTOMER_BOOKING'
        })
    };
};

describe('Module 2: Time Policies (Pure Logic)', () => {

    describe('LeadTimePolicy', () => {
        // Config: Min 60 mins anticipation
        const policy = new LeadTimePolicy(60);

        it('should ALLOW if booking is well in advance (120 min)', async () => {
            const now = '2024-01-01T10:00:00Z';
            const start = '2024-01-01T12:00:00Z'; // +2h

            const ctx = createTestContext(start, now);
            const result = await policy.evaluate(ctx);

            expect(result.status).toBe('ALLOW');
        });

        it('should DENY if booking is too soon (30 min)', async () => {
            const now = '2024-01-01T10:00:00Z';
            const start = '2024-01-01T10:30:00Z'; // +30m

            const ctx = createTestContext(start, now);
            const result = await policy.evaluate(ctx);

            expect(result.status).toBe('DENY');
            expect(result.reasonCode).toBe('booking.lead_time.too_soon');
            expect(result.actionDetails?.actualLeadMinutes).toBe(30);
        });

        it('should ALLOW exact threshold (60 min)', async () => {
            const now = '2024-01-01T10:00:00Z';
            const start = '2024-01-01T11:00:00Z'; // +60m

            const ctx = createTestContext(start, now);
            const result = await policy.evaluate(ctx);

            expect(result.status).toBe('ALLOW');
        });
    });

    describe('MaxAdvanceBookingPolicy', () => {
        // Config: Max 24 hours advance
        const policy = new MaxAdvanceBookingPolicy(24 * 60);

        it('should ALLOW within range (10 hours)', async () => {
            const now = '2024-01-01T10:00:00Z';
            const start = '2024-01-01T20:00:00Z'; // +10h

            const ctx = createTestContext(start, now);
            const result = await policy.evaluate(ctx);

            expect(result.status).toBe('ALLOW');
        });

        it('should DENY if too far in future (25 hours)', async () => {
            const now = '2024-01-01T10:00:00Z';
            const start = '2024-01-02T11:00:00Z'; // +25h

            const ctx = createTestContext(start, now);
            const result = await policy.evaluate(ctx);

            expect(result.status).toBe('DENY');
            expect(result.reasonCode).toBe('booking.max_advance.exceeded');
        });
    });
});
