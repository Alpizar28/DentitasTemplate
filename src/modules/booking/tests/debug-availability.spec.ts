
import { describe, it, expect, vi } from 'vitest';
import { SmartAvailabilityService } from '../application/services/smart-availability.service';
import { IBookingRepository } from '../domain/repositories/booking.repository';
import { ConfigService } from '../application/configuration/config.service';
import { ScheduleConfig } from '../application/configuration/config.types';

// Mock Dependencies
const mockBookingRepo = {
    findActiveBookings: vi.fn().mockResolvedValue([]),
} as unknown as IBookingRepository;

const mockConfigService = {
    getPolicyParams: vi.fn(),
} as unknown as ConfigService;

const testSchedule: ScheduleConfig = {
    timezone: 'America/Panama',
    weeklyShifts: [
        { days: ['MON', 'TUE', 'WED', 'THU', 'FRI'], start: '09:00', end: '18:00' }
    ],
    globalBreaks: [
        { name: 'Lunch', start: '13:00', end: '14:00', days: ['MON', 'TUE', 'WED', 'THU', 'FRI'] }
    ],
    exceptions: []
};

describe('Debug Availability', () => {
    it('should find slots for next Monday', async () => {
        // Setup Service
        (mockConfigService.getPolicyParams as any).mockResolvedValue(testSchedule);
        const service = new SmartAvailabilityService(mockBookingRepo, mockConfigService);

        // Date: Monday Feb 2, 2026
        const dateIso = "2026-02-02";
        const [year, month, day] = dateIso.split('-').map(Number);

        // Simulate what Action does: Local Date 00:00 -> 23:59
        // Note: In Node test env, timezone is likely Local (or UTC if CI).
        // Let's print the created dates to match Action logic
        const start = new Date(year, month - 1, day, 0, 0, 0, 0);
        const end = new Date(year, month - 1, day, 23, 59, 59, 999);

        console.log('DEBUG START:', start.toString());
        console.log('DEBUG END:', end.toString());

        const slots = await service.getSlots('res-1', start, end, {
            durationMinutes: 60,
            granularityMinutes: 60,
            bufferAfterMinutes: 0
        });

        console.log('SLOTS FOUND:', slots.length);
        slots.forEach(s => console.log('SLOT:', s.start));

        expect(slots.length).toBeGreaterThan(0);
    });
});
