import { TimeRange } from '../value-objects/time-range.vo';
import { BookingActor } from '../value-objects/booking-actor.vo';
import { BookingStatus } from '../value-objects/booking-status.vo';
import {
    InvalidBookingTransitionError,
    HoldRequiresExpiryError
} from '../errors/booking.errors';

export interface BookingProps {
    id: string;
    resourceId: string;
    period: TimeRange;
    status: BookingStatus;
    holdExpiresAt?: Date | null;
    actor: BookingActor;
    serviceRef?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

export class Booking {
    // Read-only properties accessible to outside world
    public readonly id: string;
    public readonly resourceId: string;
    public readonly period: TimeRange;
    public readonly actor: BookingActor;
    public readonly serviceRef?: string;
    public readonly metadata: Record<string, unknown>;
    public readonly createdAt: Date;

    // Mutable properties managed by methods
    private _status: BookingStatus;
    private _holdExpiresAt: Date | null;
    private _updatedAt: Date;

    constructor(props: BookingProps) {
        this.id = props.id;
        this.resourceId = props.resourceId;
        this.period = props.period;
        this._status = props.status;
        this._holdExpiresAt = props.holdExpiresAt || null;
        this.actor = props.actor;
        this.serviceRef = props.serviceRef;
        this.metadata = props.metadata || {};
        this.createdAt = props.createdAt;
        this._updatedAt = props.updatedAt;

        this.validateInvariants();
    }

    // Getters
    get status(): BookingStatus { return this._status; }
    get holdExpiresAt(): Date | null { return this._holdExpiresAt; }
    get updatedAt(): Date { return this._updatedAt; }

    // --- TRANSITIONS ---

    public hold(expiresAt: Date): void {
        if (this._status !== BookingStatus.PENDING) {
            throw new InvalidBookingTransitionError(this._status, BookingStatus.HELD, 'Only PENDING bookings can be HELD');
        }
        if (!expiresAt || expiresAt <= new Date()) {
            throw new HoldRequiresExpiryError();
        }

        this._status = BookingStatus.HELD;
        this._holdExpiresAt = expiresAt;
        this.touch();
    }

    public confirm(): void {
        // Can confirm from PENDING (skipped hold) or HELD
        if (this._status !== BookingStatus.PENDING && this._status !== BookingStatus.HELD) {
            throw new InvalidBookingTransitionError(this._status, BookingStatus.CONFIRMED);
        }

        // Check expiration logic if holding
        if (this._status === BookingStatus.HELD && this.isHoldExpired()) {
            throw new InvalidBookingTransitionError(this._status, BookingStatus.CONFIRMED, 'Hold has expired');
        }

        this._status = BookingStatus.CONFIRMED;
        this._holdExpiresAt = null; // Clear hold expiry as it is now firm
        this.touch();
    }

    public cancel(reason: string): void {
        // Can cancel from almost any active state
        if (
            this._status === BookingStatus.CANCELLED ||
            this._status === BookingStatus.COMPLETED ||
            this._status === BookingStatus.NO_SHOW
        ) {
            // Idempotent-ish check or error? Let's error for strictness
            throw new InvalidBookingTransitionError(this._status, BookingStatus.CANCELLED, 'Already terminal');
        }

        this._status = BookingStatus.CANCELLED;
        this._holdExpiresAt = null;
        this.addMetadata('cancellation_reason', reason);
        this.touch();
    }

    public complete(): void {
        if (this._status !== BookingStatus.CONFIRMED) {
            throw new InvalidBookingTransitionError(this._status, BookingStatus.COMPLETED, 'Only CONFIRMED bookings can complete');
        }
        this._status = BookingStatus.COMPLETED;
        this.touch();
    }

    public markNoShow(): void {
        if (this._status !== BookingStatus.CONFIRMED) {
            throw new InvalidBookingTransitionError(this._status, BookingStatus.NO_SHOW, 'Only CONFIRMED bookings can be NO_SHOW');
        }
        this._status = BookingStatus.NO_SHOW;
        this.touch();
    }

    // --- UTILS ---

    private touch() {
        this._updatedAt = new Date();
    }

    private isHoldExpired(): boolean {
        if (!this._holdExpiresAt) return false;
        return this._holdExpiresAt <= new Date();
    }

    private addMetadata(key: string, value: unknown) {
        this.metadata[key] = value;
    }

    private validateInvariants() {
        if (this._status === BookingStatus.HELD && !this._holdExpiresAt) {
            throw new HoldRequiresExpiryError();
        }
        if (this._status !== BookingStatus.HELD && this._holdExpiresAt) {
            // Enforce DB constraint logic in domain too: if not HELD, expiry should be null
            this._holdExpiresAt = null;
        }
    }
}
