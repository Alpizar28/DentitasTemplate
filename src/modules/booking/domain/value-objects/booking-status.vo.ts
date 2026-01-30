
export type BookingStatus =
    | 'PENDING'
    | 'HELD'
    | 'CONFIRMED'
    | 'CANCELLED'
    | 'COMPLETED'
    | 'NO_SHOW';

export const BookingStatus = {
    PENDING: 'PENDING' as BookingStatus,
    HELD: 'HELD' as BookingStatus,
    CONFIRMED: 'CONFIRMED' as BookingStatus,
    CANCELLED: 'CANCELLED' as BookingStatus,
    COMPLETED: 'COMPLETED' as BookingStatus,
    NO_SHOW: 'NO_SHOW' as BookingStatus,
};
