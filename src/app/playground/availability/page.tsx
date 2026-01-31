
'use client';

import { useState } from 'react';
import { getAvailabilityAction } from '../../actions';

export default function AvailabilityPage() {
    const [resourceId, setResourceId] = useState('11111111-1111-1111-1111-111111111111'); // Default from constraints.sql
    const [date, setDate] = useState('2024-01-01');
    const [slots, setSlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleCheck() {
        setLoading(true);
        setError('');
        const res = await getAvailabilityAction(resourceId, date);
        setLoading(false);

        if (res.success) {
            setSlots(res.data);
        } else {
            setError(res.error);
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold">Availability Explorer</h2>

            <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Resource ID</label>
                        <input className="w-full border p-2 rounded" value={resourceId} onChange={e => setResourceId(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <input type="date" className="w-full border p-2 rounded" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                </div>
                <button onClick={handleCheck} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
                    {loading ? 'Checking...' : 'Check Availability'}
                </button>
            </div>

            {error && <div className="p-4 bg-red-50 text-red-700 rounded border border-red-200">{error}</div>}

            {slots.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                    {slots.map((slot, idx) => (
                        <div key={idx} className={`p-4 rounded border text-center ${slot.status === 'AVAILABLE' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200 opacity-60'}`}>
                            <div className="font-bold">{new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            <div className="text-xs mt-1 font-mono">{slot.status}</div>
                        </div>
                    ))}
                </div>
            )}

            {slots.length === 0 && !loading && !error && (
                <div className="text-gray-500 italic">No slots loaded.</div>
            )}
        </div>
    );
}
