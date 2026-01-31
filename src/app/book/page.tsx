
import { BookingWizard } from "@/modules/booking/application/components/BookingWizard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BookPage() {
    return (
        <main className="min-h-screen bg-neutral-50 px-4 py-8 md:p-12 relative">
            <div className="max-w-4xl mx-auto mb-8">
                <Link href="/" className="inline-flex items-center text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver al Inicio
                </Link>
            </div>
            <BookingWizard />
        </main>
    )
}
