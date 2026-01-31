
'use client';

import { useState } from 'react';
import { createBookingAction } from '../../actions';

export default function ConcurrencyPage() {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    async function runTest() {
        setLoading(true);
        setResults([]);

        const formData = new FormData();
        // Dynamic 48 hours from now to pass LeadTimePolicy (min 60 mins)
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 2);

        formData.append('resourceId', '11111111-1111-1111-1111-111111111111');
        formData.append('date', futureDate.toISOString().split('T')[0]);
        formData.append('time', '12:00');
        formData.append('actorName', 'Concurrency Tester');

        // Fire 2 requests in parallel
        const p1 = createBookingAction(formData);
        const p2 = createBookingAction(formData);

        const res = await Promise.all([p1, p2]);
        setResults(res);
        setLoading(false);
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold">Concurrency / Double Booking Test</h2>
            <p className="text-gray-600">
                This test simulates 2 simultaneous requests for the exact same slot (2025-01-01 12:00).
                The database MUST reject one of them.
            </p>

            <button onClick={runTest} disabled={loading} className="px-6 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700 disabled:opacity-50">
                {loading ? 'Simulating Attack...' : '🔥 Launch Parallel Requests'}
            </button>

            <div className="grid grid-cols-2 gap-4">
                {results.map((res, i) => (
                    <div key={i} className={`p-4 rounded border ${res.success ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                        <div className="font-bold text-lg mb-2">Request #{i + 1}</div>
                        <div className={`font-mono font-bold ${res.success ? 'text-green-800' : 'text-red-800'}`}>
                            {res.success ? 'ACCEPTED' : 'REJECTED'}
                        </div>
                        {!res.success && (
                            <div className="mt-2 text-xs text-red-700 bg-red-50 p-2 rounded">
                                {res.error}
                            </div>
                        )}
                        {res.success && (
                            <div className="mt-2 text-xs text-green-700">
                                Booking ID: {res.data.id}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
