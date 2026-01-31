
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmartAvailabilityService } from './smart-availability.service';
import { ScheduleConfig, ServiceConfig } from '../../application/configuration/config.types';
import { IBookingRepository } from '../../domain/repositories/booking.repository';
import { ConfigService } from '../../application/configuration/config.service';
import { TimeRange } from '../../domain/value-objects/time-range.vo';
import { Booking } from '../../domain/entities/booking.entity';

// --- Mocks ---
const mockBookingRepo = {
    findActiveBookings: vi.fn(),
} as unknown as IBookingRepository;

const mockConfigService = {
    getPolicyParams: vi.fn(),
} as unknown as ConfigService;

describe('SmartAvailabilityService', () => {
    let service: SmartAvailabilityService;

    // Default Configuration for Tests
    const testSchedule: ScheduleConfig = {
        timezone: 'America/Panama', // UTC-5
        weeklyShifts: [
            { days: ['MON', 'TUE', 'WED', 'THU', 'FRI'], start: '09:00', end: '18:00' }
        ],
        globalBreaks: [
            { name: 'Lunch', start: '13:00', end: '14:00', days: ['MON', 'TUE', 'WED', 'THU', 'FRI'] }
        ],
        exceptions: []
    };

    const testServiceConfig: ServiceConfig = {
        durationMinutes: 60,
        granularityMinutes: 60,
        bufferAfterMinutes: 0
    };

    beforeEach(() => {
        vi.resetAllMocks();
        service = new SmartAvailabilityService(mockBookingRepo, mockConfigService);

        // Mock default config response
        (mockConfigService.getPolicyParams as any).mockResolvedValue(testSchedule);

        // Mock empty bookings by default
        (mockBookingRepo.findActiveBookings as any).mockResolvedValue([]);
    });

    it('should generate full day slots (excluding lunch) for a standard Monday', async () => {
        // Monday 2024-06-17
        const start = new Date('2024-06-17T00:00:00Z');
        const end = new Date('2024-06-17T23:59:59Z');

        const slots = await service.getSlots('res-1', start, end, testServiceConfig);

        // Expected in Panama (UTC-5):
        // 09:00 -> 14:00 UTC (9 AM)
        // 10:00 -> 15:00 UTC
        // 11:00 -> 16:00 UTC
        // 12:00 -> 17:00 UTC
        // 13:00 -> 18:00 UTC (LUNCH - Should be missing)
        // 14:00 -> 19:00 UTC
        // 15:00 -> 20:00 UTC
        // 16:00 -> 21:00 UTC
        // 17:00 -> 22:00 UTC

        // Total slots: 9 hours total - 1 hour lunch = 8 slots
        expect(slots).toHaveLength(8);

        // Verify Start Times in UTC
        // 9 AM Panama = 14:00 UTC
        expect(slots[0].start).toBe('2024-06-17T14:00:00.000Z');

        // Lunch check: 1 PM Panama = 18:00 UTC. 
        // Slot starting at 18:00 UTC should NOT exist.
        const lunchSlot = slots.find(s => s.start === '2024-06-17T18:00:00.000Z');
        expect(lunchSlot).toBeUndefined();

        // 2 PM Panama = 19:00 UTC
        const afterLunch = slots.find(s => s.start === '2024-06-17T19:00:00.000Z');
        expect(afterLunch).toBeDefined();
    });

    it('should return NO slots on Weekends (if not scheduled)', async () => {
        // Saturday 2024-06-15
        const start = new Date('2024-06-15T00:00:00Z');
        const end = new Date('2024-06-15T23:59:59Z');

        const slots = await service.getSlots('res-1', start, end, testServiceConfig);
        expect(slots).toHaveLength(0);
    });

    it('should subtract existing bookings', async () => {
        // Monday 2024-06-17
        const start = new Date('2024-06-17T00:00:00Z'); // Covers the whole day
        const end = new Date('2024-06-17T23:59:59Z');

        // Existing booking at 10 AM Panama (15:00 UTC)
        (mockBookingRepo.findActiveBookings as any).mockResolvedValue([
            {
                period: TimeRange.fromDates(
                    new Date('2024-06-17T15:00:00Z'),
                    new Date('2024-06-17T16:00:00Z')
                )
            }
        ]);

        const slots = await service.getSlots('res-1', start, end, testServiceConfig);

        // Should have 7 slots (8 originally - 1 occupied)
        expect(slots).toHaveLength(7);

        // 10 AM slot (15:00 UTC) should be gone
        const busySlot = slots.find(s => s.start === '2024-06-17T15:00:00.000Z');
        expect(busySlot).toBeUndefined();
    });

    it('should throw Strict Config Error in Production if config is missing', async () => {
        vi.stubEnv('NODE_ENV', 'production');
        (mockConfigService.getPolicyParams as any).mockResolvedValue(null);

        const start = new Date();
        const end = new Date();

        await expect(service.getSlots('res-1', start, end, testServiceConfig))
            .rejects
            .toThrow(/CRITICAL: Missing SCHEDULE configuration/);

        vi.stubEnv('NODE_ENV', 'test'); // Restore or use vi.unstubAllEnvs()
    });

    it('should handle Exceptions (CLOSED)', async () => {
        // Monday with Exception
        (mockConfigService.getPolicyParams as any).mockResolvedValue({
            ...testSchedule,
            exceptions: [
                { date: '2024-06-17', type: 'CLOSED' }
            ]
        });

        const start = new Date('2024-06-17T00:00:00Z');
        const end = new Date('2024-06-17T23:59:59Z');

        const slots = await service.getSlots('res-1', start, end, testServiceConfig);
        expect(slots).toHaveLength(0);
    });
});
