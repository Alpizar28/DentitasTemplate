
export type SlotStatus = 'AVAILABLE' | 'UNAVAILABLE';

export interface TimeSlot {
    start: string;
    end: string;
    status: SlotStatus;
}
