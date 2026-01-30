
export class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
        // Maintains proper stack trace for where our error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export class InvalidTimeRangeError extends DomainError {
    constructor(reason: string) {
        super(`Invalid TimeRange: ${reason}`);
    }
}

export class InvalidBookingTransitionError extends DomainError {
    constructor(from: string, to: string, reason?: string) {
        super(`Invalid transition from ${from} to ${to}${reason ? ` (${reason})` : ''}`);
    }
}

export class HoldRequiresExpiryError extends DomainError {
    constructor() {
        super('Booking status HELD requires a valid expiration date');
    }
}

export class InvalidBookingActorError extends DomainError {
    constructor(reason: string) {
        super(`Invalid Booking Actor: ${reason}`);
    }
}

export class OverlapError extends DomainError {
    constructor(message = 'Selected time slot overlaps with an existing booking') {
        super(message);
    }
}

export class ResourceNotFoundError extends DomainError {
    constructor(resourceId: string) {
        super(`Resource not found: ${resourceId}`);
    }
}

export class BookingNotFoundError extends DomainError {
    constructor(bookingId: string) {
        super(`Booking not found: ${bookingId}`);
    }
}
