import { InvalidBookingActorError } from '../errors/booking.errors';

export type ActorType = 'CUSTOMER' | 'STAFF' | 'SYSTEM' | 'API';

export interface ActorDetails {
    name?: string;
    email?: string;
    ip?: string;
    [key: string]: unknown;
}

export class BookingActor {
    readonly type: ActorType;
    readonly id: string;
    readonly details: ActorDetails;

    private constructor(type: ActorType, id: string, details: ActorDetails) {
        if (!id) throw new InvalidBookingActorError('ID is required');
        this.type = type;
        this.id = id;
        this.details = details;
    }

    static create(type: ActorType, id: string, details: ActorDetails = {}): BookingActor {
        return new BookingActor(type, id, details);
    }

    // Helper for persistence (JSONB)
    toJSON() {
        return {
            type: this.type,
            id: this.id,
            details: this.details
        };
    }

    static fromJSON(json: any): BookingActor {
        if (!json.type || !json.id) {
            throw new InvalidBookingActorError('Missing type or id in JSON');
        }
        return new BookingActor(json.type, json.id, json.details || {});
    }
}
