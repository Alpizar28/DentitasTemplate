import { TimeRange } from './time-range.vo';

export type TimeSlotRequestType = 'CUSTOMER_BOOKING' | 'ADMIN_BLOCK';

export interface TimeSlotRequestProps {
    resourceId: string;
    start: string; // ISO
    end: string;   // ISO
    type: TimeSlotRequestType;
    metadata?: Record<string, any>;
}

export class TimeSlotRequest {
    public readonly resourceId: string;
    public readonly timeRange: TimeRange;
    public readonly type: TimeSlotRequestType;
    public readonly metadata?: Record<string, any>;

    constructor(props: TimeSlotRequestProps) {
        this.resourceId = props.resourceId;
        this.type = props.type;
        this.metadata = props.metadata;
        // Validation happens inside TimeRange constructor
        this.timeRange = TimeRange.fromISO(props.start, props.end);
    }
}
