
import { SupabaseClient } from '@supabase/supabase-js';
import { IBookingRepository } from '../../domain/repositories/booking.repository';
import { TimeRange } from '../../domain/value-objects/time-range.vo';
import { TimeSlot } from '../../domain/value-objects/time-slot';
import { ConfigService } from '../../application/configuration/config.service';
// @ts-ignore
import { addDays, eachDayOfInterval, format, isBefore, parse, set, subMinutes, addMinutes, isAfter, areIntervalsOverlapping } from 'date-fns';
// @ts-ignore
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

import { ScheduleConfig, ServiceConfig } from '../../application/configuration/config.types';


/**
 * Smart Availability Engine
 * Calculates valid slots based on Schedule Config + Existing Bookings.
 */
export class SmartAvailabilityService {
    constructor(
        private bookingRepo: IBookingRepository,
        private configService: ConfigService
    ) { }

    /**
     * Main Entry Point: Get all bookable slots for a date range
     */
    async getSlots(
        resourceId: string,
        start: Date,
        end: Date,
        serviceConfig: ServiceConfig
    ): Promise<TimeSlot[]> {
        // Parallel Fetch: Schedule & Existing Bookings
        // This significantly reduces latency by avoiding sequential DB waterfalls.
        const [schedule, busyRanges] = await Promise.all([
            this.loadSchedule(resourceId),
            this.getBusyRanges(resourceId, start, end)
        ]);

        const timeZone = schedule.timezone || 'UTC';

        // 2. Generate Base Availability (Shifts - Exceptions)
        const effectiveRanges = this.generateEffectiveRanges(start, end, schedule, timeZone);

        // 3. Subtract Breaks (Global Breaks)
        const rangeAfterBreaks = this.subtractBreaks(effectiveRanges, schedule, timeZone);

        // 4. Subtract Occupied Time (Bookings)
        // busyRanges is already fetched
        const netRanges = this.subtractBusyRanges(rangeAfterBreaks, busyRanges);

        // 5. Generate Slots from Net Ranges
        return this.generateSlotsFromRanges(netRanges, serviceConfig);
    }

    private async loadSchedule(resourceId: string): Promise<ScheduleConfig> {
        // Safe default config (For DEV/Local only)
        const DefaultSchedule: ScheduleConfig = {
            timezone: 'UTC',
            weeklyShifts: [
                { days: [1, 2, 3, 4, 5], start: '09:00', end: '18:00' } // Mon-Fri 9-6
            ],
            globalBreaks: [
                { name: 'Lunch', start: '13:00', end: '14:00', days: [1, 2, 3, 4, 5] }
            ],
            exceptions: []
        };

        // Attempt load from ConfigService
        const config = await this.configService.getPolicyParams<ScheduleConfig>(`SCHEDULE_DEFAULT`);

        // STRICT CONFIG CHECK (Production Safety)
        if (process.env.NODE_ENV === 'production' && !config) {
            throw new Error('[SmartAvailability] CRITICAL: Missing SCHEDULE configuration in PRODUCTION. System cannot assume defaults.');
        }

        return config ? { ...DefaultSchedule, ...config } : DefaultSchedule;
    }

    /**
     * Helper to map string days to date-fns integers (0=Sun, 1=Mon, ..., 6=Sat)
     */
    private mapDay(day: string | number): number {
        if (typeof day === 'number') return day;
        const map: Record<string, number> = {
            'SUN': 0, 'MON': 1, 'TUE': 2, 'WED': 3, 'THU': 4, 'FRI': 5, 'SAT': 6
        };
        return map[day.toUpperCase()] ?? -1;
    }

    private generateEffectiveRanges(start: Date, end: Date, schedule: ScheduleConfig, timeZone: string): TimeRange[] {
        const ranges: TimeRange[] = [];
        const intervalDays = eachDayOfInterval({ start, end });

        for (const day of intervalDays) {
            // Check Exceptions
            const dayYMD = formatInTimeZone(day, timeZone, 'yyyy-MM-dd');
            const exception = schedule.exceptions.find(e => e.date === dayYMD);

            if (exception?.type === 'CLOSED' || exception?.type === 'BLACKOUT') {
                continue; // Skip day
            }

            let startStr = '';
            let endStr = '';

            if (exception?.type === 'MODIFIED' && exception.start && exception.end) {
                // Use modified hours
                startStr = exception.start;
                endStr = exception.end;
            } else {
                // Use Weekly Rule
                // 0=Sun, 1=Mon... as per date-fns getDay()
                const dayOfWeek = parseInt(formatInTimeZone(day, timeZone, 'i')) % 7;

                const shift = schedule.weeklyShifts.find(s => {
                    return s.days.some(d => this.mapDay(d) === dayOfWeek);
                });

                if (!shift) continue; // No shift this day

                startStr = shift.start;
                endStr = shift.end;
            }

            // Create Dates in UTC correctly
            // Create a Date object representing the time in the target TimeZone, then get absolute UTC
            const shiftStart = this.parseTimeInZone(dayYMD, startStr, timeZone);
            const shiftEnd = this.parseTimeInZone(dayYMD, endStr, timeZone);

            if (shiftStart && shiftEnd && isBefore(shiftStart, shiftEnd)) {
                // Clip with requested range to ensure we don't return slots outside the query window
                // (Critical for correct handling of TZ boundaries)
                const queryStart = start; // Already Date object
                const queryEnd = end;

                // Manual overlap check & intersection
                if (shiftStart < queryEnd && shiftEnd > queryStart) {
                    const clippedStart = shiftStart < queryStart ? queryStart : shiftStart;
                    const clippedEnd = shiftEnd > queryEnd ? queryEnd : shiftEnd;

                    if (isBefore(clippedStart, clippedEnd)) {
                        ranges.push(TimeRange.fromDates(clippedStart, clippedEnd));
                    }
                }
            }
        }
        return ranges;
    }

    private parseTimeInZone(dateYMD: string, timeHHMM: string, timeZone: string): Date {
        // e.g. 2024-01-01 09:00 in America/New_York
        // We use fromZonedTime to get the UTC Date object
        const dateTimeStr = `${dateYMD} ${timeHHMM}`;
        return fromZonedTime(dateTimeStr, timeZone);
    }

    private subtractBreaks(ranges: TimeRange[], schedule: ScheduleConfig, timeZone: string): TimeRange[] {
        let currentRanges = [...ranges];

        for (const brk of schedule.globalBreaks) {
            const newRanges: TimeRange[] = [];

            for (const range of currentRanges) {
                // Determine if this break applies to this range's day
                const rangeStartZoned = toZonedTime(range.start, timeZone);
                const dayOfWeek = parseInt(format(rangeStartZoned, 'i')) % 7;
                // Note: 'i' returns 1(Mon)..7(Sun). %7 -> 1..0(Sun). 
                // If format is used on UTC date, it might shift day.
                // Correct logic: Convert UTC range start to Zoned Day.

                const appliesToDay = brk.days.some(d => this.mapDay(d) === dayOfWeek);

                if (!appliesToDay) {
                    newRanges.push(range);
                    continue;
                }

                const dayYMD = format(rangeStartZoned, 'yyyy-MM-dd');
                const breakStart = this.parseTimeInZone(dayYMD, brk.start, timeZone);
                const breakEnd = this.parseTimeInZone(dayYMD, brk.end, timeZone);
                const breakRange = TimeRange.fromDates(breakStart, breakEnd);

                // Subtract
                const parts = this.diffRange(range, breakRange);
                newRanges.push(...parts);
            }
            currentRanges = newRanges;
        }
        return currentRanges;
    }

    private async getBusyRanges(resourceId: string, start: Date, end: Date): Promise<TimeRange[]> {
        const bookings = await this.bookingRepo.findActiveBookings(resourceId, TimeRange.fromDates(start, end));
        return bookings.map(b => b.period);
    }

    private subtractBusyRanges(available: TimeRange[], busy: TimeRange[]): TimeRange[] {
        let currentRanges = [...available];

        for (const busyRange of busy) {
            const newRanges: TimeRange[] = [];
            for (const freeRange of currentRanges) {
                newRanges.push(...this.diffRange(freeRange, busyRange));
            }
            currentRanges = newRanges;
        }
        return currentRanges;
    }

    /**
     * Helper: A - B (Set difference)
     * Returns: array of ranges (0, 1 or 2 parts)
     */
    private diffRange(a: TimeRange, b: TimeRange): TimeRange[] {
        if (!a.overlaps(b)) return [a];

        const results: TimeRange[] = [];

        // Part before overlap
        if (isBefore(a.start, b.start)) {
            results.push(TimeRange.fromDates(a.start, b.start));
        }

        // Part after overlap
        if (isAfter(a.end, b.end)) {
            results.push(TimeRange.fromDates(b.end, a.end));
        }

        return results;
    }

    private generateSlotsFromRanges(ranges: TimeRange[], config: ServiceConfig): TimeSlot[] {
        const slots: TimeSlot[] = [];
        const totalDuration = config.durationMinutes + (config.bufferAfterMinutes || 0);

        for (const range of ranges) {
            let current = range.start;
            const endLimit = range.end;

            while (true) {
                const slotEnd = addMinutes(current, config.durationMinutes);
                const totalEnd = addMinutes(current, totalDuration);

                // Check if fits
                if (isAfter(totalEnd, endLimit)) break;

                // Filter past slots
                // Note: In production we might want to pass 'now' as argument for testability
                if (isBefore(current, new Date())) {
                    current = addMinutes(current, config.granularityMinutes);
                    continue;
                }

                slots.push({
                    start: current.toISOString(),
                    end: slotEnd.toISOString(),
                    status: 'AVAILABLE'
                });

                // Next Step
                current = addMinutes(current, config.granularityMinutes);
            }
        }
        return slots;
    }
}
