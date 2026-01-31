
'use client';

import { useState, useEffect } from 'react';
import { listBookingsAction, confirmBookingAction, cancelBookingAction } from '../../actions';

export default function BookingsListPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        const res = await listBookingsAction();
        if (res.success) {
            setBookings(res.data);
        }
        setLoading(false);
    }

    useEffect(() => {
        load();
    }, []);

    async function handleConfirm(id: string) {
        if (!confirm('Confirm this booking?')) return;
        await confirmBookingAction(id);
        load();
    }

    async function handleCancel(id: string) {
        if (!confirm('Cancel this booking?')) return;
        await cancelBookingAction(id);
        load();
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Bookings List</h2>
                <button onClick={load} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">Refresh</button>
            </div>

            {loading && <div>Loading...</div>}

            {!loading && (
                <div className="bg-white rounded-lg shadow overflow-hidden border">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                            <tr>
                                <th className="p-4">ID</th>
                                <th className="p-4">Resource</th>
                                <th className="p-4">Period</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {bookings.map(b => (
                                <tr key={b.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-mono text-xs">{b.id.substring(0, 8)}...</td>
                                    <td className="p-4 font-mono text-xs text-gray-500">{b.resource_id.substring(0, 8)}...</td>
                                    <td className="p-4">{b.period}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${b.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                                b.status === 'HELD' ? 'bg-amber-100 text-amber-800' :
                                                    b.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                            }`}>
                                            {b.status}
                                        </span>
                                    </td>
                                    <td className="p-4 space-x-2">
                                        {(b.status === 'HELD' || b.status === 'PENDING') && (
                                            <button onClick={() => handleConfirm(b.id)} className="text-blue-600 hover:underline">Confirm</button>
                                        )}
                                        {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                                            <button onClick={() => handleCancel(b.id)} className="text-red-600 hover:underline">Cancel</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {bookings.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-gray-500">No bookings found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
