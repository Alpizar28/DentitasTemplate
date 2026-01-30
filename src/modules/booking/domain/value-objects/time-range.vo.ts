import { InvalidTimeRangeError } from '../errors/booking.errors';

export class TimeRange {
    readonly start: Date;
    readonly end: Date;

    private constructor(start: Date, end: Date) {
        if (end <= start) {
            throw new InvalidTimeRangeError('End time must be strictly greater than start time');
        }
        this.start = start;
        this.end = end;
    }

    static fromDates(start: Date, end: Date): TimeRange {
        return new TimeRange(start, end);
    }

    static fromISO(startIso: string, endIso: string): TimeRange {
        const start = new Date(startIso);
        const end = new Date(endIso);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new InvalidTimeRangeError('Invalid ISO date string');
        }

        return new TimeRange(start, end);
    }

    durationMinutes(): number {
        return (this.end.getTime() - this.start.getTime()) / (1000 * 60);
    }

    overlaps(other: TimeRange): boolean {
        // Standard [start, end) overlap logic
        // Overlap if (StartA < EndB) and (EndA > StartB)
        return this.start < other.end && this.end > other.start;
    }

    toString(): string {
        return `[${this.start.toISOString()}, ${this.end.toISOString()})`;
    }
}
