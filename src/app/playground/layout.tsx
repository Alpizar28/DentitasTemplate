
import Link from 'next/link';

export default function PlaygroundLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-slate-900 text-white p-4 shadow-md">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="font-bold text-lg">BellBooking Playground <span className="opacity-50 text-sm font-normal">– Internal Debug UI</span></h1>
                    <nav className="space-x-4 text-sm">
                        <Link href="/playground/availability" className="hover:text-amber-400">Availability</Link>
                        <Link href="/playground/book" className="hover:text-amber-400">Book</Link>
                        <Link href="/playground/bookings" className="hover:text-amber-400">Bookings</Link>
                        <Link href="/playground/concurrency" className="hover:text-amber-400">Concurrency</Link>
                    </nav>
                </div>
            </header>
            <main className="flex-grow container mx-auto p-6">
                {children}
            </main>
            <footer className="bg-gray-200 text-center p-4 text-xs text-gray-500">
                BellBooking Template v1.0.0
            </footer>
        </div>
    )
}
