import { TimeRange } from '../../domain/value-objects/time-range.vo';
import { IBookingRepository } from '../../domain/repositories/booking.repository';
import { format, addMinutes, startOfDay, addHours } from 'date-fns';

export type SlotStatus = 'AVAILABLE' | 'UNAVAILABLE';

export interface TimeSlot {
    start: string;
    end: string;
    status: SlotStatus;
}

export class AvailabilityService {
    constructor(private bookingRepo: IBookingRepository) { }

    async getSlots(resourceId: string, date: Date): Promise<TimeSlot[]> {
        const slots: TimeSlot[] = [];

        // Hardcoded 09:00 to 18:00 for Playground visualization
        let current = addHours(startOfDay(date), 9);
        const endOfDay = addHours(startOfDay(date), 18);

        while (current < endOfDay) {
            const end = addMinutes(current, 60); // 1 hour slots
            const range = TimeRange.fromDates(current, end);

            const hasConflict = await this.bookingRepo.hasConflicts(resourceId, range);

            slots.push({
                start: current.toISOString(),
                end: end.toISOString(),
                status: hasConflict ? 'UNAVAILABLE' : 'AVAILABLE'
            });

            current = end;
        }

        return slots;
    }
}
