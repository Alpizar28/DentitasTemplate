
'use client';

import { useState } from 'react';
import { createBookingAction } from '../../actions';

export default function BookPage() {
    const [result, setResult] = useState<any>(null);

    async function handleSubmit(formData: FormData) {
        setResult(null);
        const res = await createBookingAction(formData);
        setResult(res);
    }

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold">Create Booking</h2>

            <form action={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Resource ID</label>
                    <input name="resourceId" defaultValue="11111111-1111-1111-1111-111111111111" className="w-full border p-2 rounded" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <input name="date" type="date" defaultValue="2024-01-01" className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Time (Start)</label>
                        <input name="time" type="time" defaultValue="10:00" className="w-full border p-2 rounded" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Actor Name</label>
                    <input name="actorName" defaultValue="John Doe" className="w-full border p-2 rounded" />
                </div>

                <button type="submit" className="w-full py-3 bg-purple-600 text-white rounded hover:bg-purple-700 font-bold">
                    Create Booking (Hold)
                </button>
            </form>

            {result && (
                <div className={`p-4 rounded border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <h3 className="font-bold mb-2">{result.success ? 'Success' : 'Error'}</h3>
                    <pre className="text-xs overflow-auto max-h-60 whitespace-pre-wrap">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
