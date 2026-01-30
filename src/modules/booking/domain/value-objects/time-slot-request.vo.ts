import { TimeRange } from './time-range.vo';

export type TimeSlotRequestType = 'CUSTOMER_BOOKING' | 'ADMIN_BLOCK';

export interface TimeSlotRequestProps {
    resourceId: string;
    start: string; // ISO
    end: string;   // ISO
    type: TimeSlotRequestType;
}

export class TimeSlotRequest {
    public readonly resourceId: string;
    public readonly timeRange: TimeRange;
    public readonly type: TimeSlotRequestType;

    constructor(props: TimeSlotRequestProps) {
        this.resourceId = props.resourceId;
        this.type = props.type;
        // Validation happens inside TimeRange constructor
        this.timeRange = TimeRange.fromISO(props.start, props.end);
    }
}
