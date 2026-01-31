
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    Calendar,
    Settings,
    LogOut,
    Menu,
    X,
    Bell
} from 'lucide-react'
import { createClient } from '@/shared/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/ui-core/button'
import { motion, AnimatePresence } from 'framer-motion'

const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Pacientes', href: '/admin/patients', icon: Users },
    { name: 'Citas', href: '/admin/appointments', icon: Calendar },
    { name: 'Configuración', href: '/admin/settings', icon: Settings },
]

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
        router.push('/admin/login')
    }

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 w-full h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
                        <Menu className="h-6 w-6 text-gray-600" />
                    </Button>
                    <span className="text-lg font-bold text-gray-900 tracking-tight">Dentistas<span className="text-blue-600">App</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5 text-gray-500" />
                        <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
                    </Button>
                </div>
            </header>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 lg:hidden"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-72 bg-white z-50 lg:hidden shadow-2xl"
                        >
                            <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
                                <span className="text-xl font-bold text-gray-900 tracking-tight">Dentistas<span className="text-blue-600">App</span></span>
                                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                                    <X className="h-6 w-6 text-gray-400" />
                                </Button>
                            </div>
                            <nav className="mt-5 px-4 space-y-1">
                                {navigation.map((item) => {
                                    const isActive = pathname?.startsWith(item.href)
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setIsSidebarOpen(false)}
                                            className={classNames(
                                                isActive
                                                    ? 'bg-blue-50 text-blue-700'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                                'group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all'
                                            )}
                                        >
                                            <item.icon className={classNames(isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500', 'mr-3 h-5 w-5')} />
                                            {item.name}
                                        </Link>
                                    )
                                })}
                            </nav>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Sidebar - Desktop */}
            <aside className="hidden w-64 flex-col bg-white border-r border-gray-200 lg:flex fixed inset-y-0 z-40">
                <div className="flex h-16 items-center px-6 border-b border-gray-100">
                    <span className="text-xl font-bold text-gray-900 tracking-tight">Dentistas<span className="text-blue-600">App</span></span>
                </div>

                <div className="flex flex-1 flex-col overflow-y-auto pt-8 pb-4">
                    <nav className="flex-1 space-y-1.5 px-4">
                        {navigation.map((item) => {
                            const isActive = pathname?.startsWith(item.href)
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={classNames(
                                        isActive
                                            ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                        'group flex items-center px-4 py-2.5 text-sm font-semibold rounded-xl transition-all'
                                    )}
                                >
                                    <item.icon
                                        className={classNames(
                                            isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500',
                                            'mr-3 h-5 w-5 flex-shrink-0 transition-colors'
                                        )}
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                <div className="flex flex-shrink-0 border-t border-gray-100 p-4">
                    <div className="flex items-center w-full px-2 py-3 bg-gray-50 rounded-2xl">
                        <div className="flex-1 min-w-0 px-2">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Doctor</p>
                            <p className="text-sm font-bold text-gray-900 truncate">Sesión Activa</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                            onClick={handleSignOut}
                            title="Cerrar Sesión"
                        >
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex flex-1 flex-col lg:pl-64">
                <main className="flex-1 pt-24 pb-12 px-4 sm:px-10 lg:pt-12 transition-all">
                    {children}
                </main>
            </div>
        </div>
    )
}
