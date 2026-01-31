
import { createClient } from '@/shared/lib/supabase/server'
import { AppointmentsTable, Appointment } from './appointments-table'
import { CalendarDays, Users, TrendingUp } from 'lucide-react'

async function getData() {
    // Helper to fetch data - implementing mock for Demo
    // In production, query 'bookings' table
    return [
        { id: '1', time: '09:00', patient: 'Ana García', treatment: 'Limpieza Dental', status: 'confirmed' },
        { id: '2', time: '10:30', patient: 'Carlos Ruiz', treatment: 'Ortodoncia', status: 'pending' },
        { id: '3', time: '11:45', patient: 'María López', treatment: 'Extracción', status: 'pending' },
        { id: '4', time: '16:00', patient: 'Jorge Fernandez', treatment: 'Revisión General', status: 'cancelled' },
    ] as Appointment[]
}

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const appointments = await getData()

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Panel de Control
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Bienvenido, <span className="font-semibold text-gray-900">{user?.email || 'Doctor'}</span>. Aquí está el resumen de hoy.
                    </p>
                </div>
                <div className="self-start sm:self-auto text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm ring-1 ring-gray-900/5">
                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-default">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                            <CalendarDays className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Citas Hoy</p>
                            <h3 className="text-2xl font-bold text-gray-900">{appointments.length}</h3>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-default">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Pacientes Activos</p>
                            <h3 className="text-2xl font-bold text-gray-900">1,234</h3>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-default">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-green-50 text-green-600">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Ingresos (Mes)</p>
                            <h3 className="text-2xl font-bold text-gray-900">$12,450</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Próximas Citas</h2>
                    <Button variant="link" className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium">
                        Ver calendario completo &rarr;
                    </Button>
                </div>
                <AppointmentsTable appointments={appointments} />
            </div>
        </div>
    )
}

function Button({ variant, className, children, ...props }: any) {
    // Simple Mock of Button if importing fails or for custom link usage in server component (though we used client component for real buttons)
    // Actually we imported Button from ui-core in the client component. 
    // Here I'm using a simple span disguised, but wait, I can't import Client Component specific props easily if they are not exported.
    // I'll just use a normal html element for the "Ver calendario" link to avoid issues.
    return <button className={className} {...props}>{children}</button>
}
