"use client"

import { useState } from "react"
import { Button } from "@/ui-core/button"
import Link from "next/link"
import { ArrowRight, Star, MapPin, Mail, Instagram, MessageCircle, Heart, Microscope, Smile, Plus, Minus, ZoomIn, Menu, X, LucideIcon } from "lucide-react"
import baseConfig from "../../seeds/base-config.json"

// --- Types ---
interface Branding {
    name: string
    logoUrl?: string // Optional, not used in current code
    colors?: { // Optional, not used in current code
        primary: string
        secondary: string
        accent: string
        background: string
    }
}

interface HeroSection {
    title: string
    subtitle: string
    ctaText: string
    ctaLink: string
    backgroundImage: string
}

interface Feature {
    id: string
    title: string
    description: string
    icon: string
}

interface Testimonial {
    id: string
    name: string
    role: string
    text: string
}

interface TeamMember {
    name: string
    role: string
    image: string
}

interface Gallery {
    title: string
    subtitle: string
    images: string[]
}

interface AboutUs {
    title: string
    subtitle: string
    description: string
    imageUrl: string
    stats: { value: string; label: string }[]
}

interface FaqItem {
    question: string
    answer: string
}

interface Contact {
    address: string
    phone?: string // Optional, not used in current code
    email: string
    instagram?: string
    whatsapp?: string
}

interface SectionFlags {
    hero: boolean
    about: boolean
    features: boolean
    testimonials: boolean
    faq: boolean
    contact: boolean
    team: boolean
    gallery: boolean
}

interface LandingPageConfig {
    branding: Branding
    sections?: Partial<SectionFlags> // Make sections optional for backward compatibility
    hero: HeroSection
    features: Feature[]
    testimonials: Testimonial[]
    aboutUs?: AboutUs
    team?: { title: string; members: TeamMember[] }
    gallery?: Gallery
    faq?: FaqItem[]
    contact: Contact
}

// --- Icon Loader ---
const Icons: Record<string, LucideIcon> = {
    Heart,
    Microscope,
    Smile,
    Star
}

// --- Components ---

interface NavbarProps {
    branding: Branding
    sections: SectionFlags
    isMobileMenuOpen: boolean
    toggleMenu: () => void
}

const Navbar = ({ branding, sections, isMobileMenuOpen, toggleMenu }: NavbarProps) => {
    const { about, team, features, gallery, testimonials, faq } = sections
    return (
        <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="font-bold text-2xl tracking-tighter flex items-center gap-3 relative z-50">
                    <div className="w-10 h-10 bg-neutral-900 rounded-full flex items-center justify-center text-white">
                        <Smile className="w-6 h-6" />
                    </div>
                    {branding.name}
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
                    {about && <a href="#about" className="hover:text-neutral-900 transition-colors">Nosotros</a>}
                    {team && <a href="#team" className="hover:text-neutral-900 transition-colors">Equipo</a>}
                    {features && <a href="#features" className="hover:text-neutral-900 transition-colors">Servicios</a>}
                    {gallery && <a href="#gallery" className="hover:text-neutral-900 transition-colors">Resultados</a>}
                    {testimonials && <a href="#testimonials" className="hover:text-neutral-900 transition-colors">Testimonios</a>}
                    {faq && <a href="#faq" className="hover:text-neutral-900 transition-colors">FAQ</a>}
                    <Link href="/book">
                        <Button size="default" className="rounded-full px-6 shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white border-0">
                            Reservar Cita
                        </Button>
                    </Link>
                </div>

                <button className="md:hidden relative z-50 p-2 -mr-2 text-neutral-600" onClick={toggleMenu} aria-label="Toggle Menu">
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>

                {isMobileMenuOpen && (
                    <div className="fixed inset-0 bg-white z-40 flex flex-col pt-32 px-6 animate-in slide-in-from-top-10 duration-300">
                        <div className="flex flex-col gap-8 text-2xl font-bold text-neutral-900">
                            {about && <a href="#about" onClick={toggleMenu} className="border-b border-neutral-100 pb-4">Nosotros</a>}
                            {team && <a href="#team" onClick={toggleMenu} className="border-b border-neutral-100 pb-4">Equipo</a>}
                            {features && <a href="#features" onClick={toggleMenu} className="border-b border-neutral-100 pb-4">Servicios</a>}
                            {gallery && <a href="#gallery" onClick={toggleMenu} className="border-b border-neutral-100 pb-4">Resultados</a>}
                            {testimonials && <a href="#testimonials" onClick={toggleMenu} className="border-b border-neutral-100 pb-4">Testimonios</a>}
                            {faq && <a href="#faq" onClick={toggleMenu} className="border-b border-neutral-100 pb-4">FAQ</a>}
                            <Link href="/book" onClick={toggleMenu}>
                                <Button size="lg" className="w-full rounded-full py-6 text-lg shadow-xl shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white border-0 mt-4">
                                    Reservar Cita
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}

const Hero = ({ data }: { data: HeroSection }) => (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    Agenda Abierta 2026
                </div>

                <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] text-neutral-900">
                    {data.title.split(" ").map((word, i) => (
                        <span key={i} className="block">{word}</span>
                    ))}
                </h1>

                <p className="text-xl text-neutral-500 max-w-lg leading-relaxed border-l-4 border-blue-500 pl-6">
                    {data.subtitle}
                </p>

                <div className="flex flex-col sm:flex-row gap-5">
                    <Link href={data.ctaLink}>
                        <Button size="lg" className="rounded-full px-10 py-7 text-lg shadow-xl shadow-blue-600/20 bg-neutral-900 text-white hover:bg-neutral-800 transition-all hover:scale-105">
                            {data.ctaText} <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </Link>
                </div>

                <div className="flex items-center gap-6 pt-6 opacity-80 grayscale hover:grayscale-0 transition-all duration-500">
                    <div className="h-8 w-24 bg-neutral-200/50 rounded animate-pulse" />
                    <div className="h-8 w-24 bg-neutral-200/50 rounded animate-pulse" />
                    <div className="h-8 w-24 bg-neutral-200/50 rounded animate-pulse" />
                </div>
            </div>

            <div className="relative h-[600px] w-full hidden lg:block animate-in fade-in zoom-in duration-1000 delay-300">
                <div className="absolute top-10 right-10 w-full h-full bg-blue-100 rounded-[3rem] -z-10 transform rotate-3" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/20 z-20 pointer-events-none" />
                <img
                    src={data.backgroundImage}
                    alt="Consultorio Moderno"
                    className="object-cover w-full h-full rounded-[3rem] shadow-2xl transform hover:-translate-y-2 transition-transform duration-700"
                />
                <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-2xl shadow-xl max-w-xs border border-neutral-50 animate-bounce delay-1000 duration-[3000ms]">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-neutral-200" />)}
                        </div>
                        <div className="text-sm font-bold text-neutral-900">500+ <br /><span className="text-neutral-400 font-normal">Pacientes</span></div>
                    </div>
                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-green-500 w-[90%] h-full" />
                    </div>
                </div>
            </div>
        </div>
    </section>
)

const About = ({ data }: { data: AboutUs }) => (
    <section id="about" className="py-32 bg-neutral-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center relative z-10">
            <div className="relative">
                <div className="absolute inset-0 border-2 border-white/10 translate-x-4 translate-y-4 rounded-2xl" />
                <img
                    src={data.imageUrl}
                    alt="Doctor"
                    className="relative rounded-2xl grayscale hover:grayscale-0 transition-all duration-700 shadow-2xl"
                />
            </div>
            <div className="space-y-8">
                <p className="text-blue-400 font-bold uppercase tracking-widest text-sm">{data.subtitle}</p>
                <h2 className="text-4xl md:text-5xl font-bold">{data.title}</h2>
                <div className="w-20 h-1 bg-blue-500" />
                <p className="text-neutral-400 text-lg leading-relaxed">{data.description}</p>
                <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/10">
                    {data.stats.map((stat, i) => (
                        <div key={i}>
                            <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                            <p className="text-xs text-neutral-500 uppercase tracking-wider">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </section>
)

const Team = ({ data }: { data: { title: string; members: TeamMember[] } }) => (
    <section id="team" className="py-32 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">{data.title}</h2>
                <p className="text-neutral-500">Profesionales certificados dedicados a tu salud.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                {data.members.map((member, i) => (
                    <div key={i} className="group bg-white p-4 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-neutral-100 text-center">
                        <div className="relative mb-6 overflow-hidden rounded-2xl aspect-[4/5]">
                            <img
                                src={member.image}
                                alt={member.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                                <span className="text-white font-medium text-sm bg-white/20 backdrop-blur-md px-4 py-1 rounded-full border border-white/30">Agendar Cita</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold">{member.name}</h3>
                        <p className="text-blue-600 font-medium text-sm">{member.role}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
)

const Features = ({ data }: { data: Feature[] }) => (
    <section id="features" className="py-32 bg-neutral-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 max-w-3xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-neutral-900">Experiencia Premium</h2>
                <p className="text-xl text-neutral-500">Redefinimos la visita al dentista combinando tecnología, confort y resultados excepcionales.</p>
            </div>
            <div className="flex flex-col md:flex-row gap-4 h-auto md:h-[500px] w-full">
                {data.map((feature) => {
                    const Icon = Icons[feature.icon] || Star
                    return (
                        <div
                            key={feature.id}
                            className="group relative flex-1 hover:flex-[2.5] transition-[flex-grow] duration-500 ease-in-out overflow-hidden rounded-3xl bg-white border border-neutral-200 shadow-sm hover:shadow-2xl flex flex-col justify-end p-8"
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute top-8 left-8 w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:bg-white/20 group-hover:text-white group-hover:scale-110 z-10">
                                <Icon className="w-6 h-6" />
                            </div>
                            <div className="relative z-10 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                <h3 className="text-2xl font-bold mb-2 text-neutral-900 group-hover:text-white transition-colors delay-75">
                                    {feature.title}
                                </h3>
                                <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500">
                                    <p className="overflow-hidden text-lg text-neutral-300 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                                <div className="md:hidden mt-2 text-neutral-500">{feature.description}</div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    </section>
)

const Gallery = ({ data }: { data: Gallery }) => (
    <section id="gallery" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                <div className="max-w-2xl">
                    <h2 className="text-4xl font-bold mb-4">{data.title}</h2>
                    <p className="text-xl text-neutral-500">{data.subtitle}</p>
                </div>
                <Link href="/book">
                    <Button variant="outline" className="rounded-full border-neutral-300 hover:bg-neutral-50">
                        Ver Casos de Éxito <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {data.images.map((img, i) => (
                    <div key={i} className={`group relative overflow-hidden rounded-2xl cursor-pointer ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors z-10" />
                        <ZoomIn className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 group-hover:opacity-100 transition-all z-20 scale-50 group-hover:scale-100 duration-300" />
                        <img
                            src={img}
                            alt={`Resultado ${i + 1}`}
                            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${i === 0 ? 'aspect-square md:aspect-auto' : 'aspect-square'}`}
                        />
                    </div>
                ))}
            </div>
        </div>
    </section>
)

const Testimonials = ({ data }: { data: Testimonial[] }) => (
    <section id="testimonials" className="py-32 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-16">Pacientes Felices</h2>
            <div className="flex flex-wrap justify-center gap-8">
                {data.map((t, i) => (
                    <div key={t.id} className="bg-white p-8 rounded-3xl shadow-lg shadow-neutral-100 border border-neutral-100 max-w-md hover:-translate-y-2 transition-transform duration-300">
                        <div className="flex gap-1 text-yellow-400 mb-6">
                            {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
                        </div>
                        <p className="text-lg font-medium text-neutral-700 mb-8 leading-relaxed">"{t.text}"</p>
                        <div className="flex items-center gap-4 border-t border-neutral-50 pt-6">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
                                ${i % 2 === 0 ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}
                             `}>
                                {t.name.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-neutral-900">{t.name}</p>
                                <p className="text-sm text-neutral-400">{t.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
)

const FAQ = ({ data }: { data: FaqItem[] }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null)
    return (
        <section id="faq" className="py-32 bg-neutral-50">
            <div className="max-w-3xl mx-auto px-6">
                <h2 className="text-4xl font-bold text-center mb-16 tracking-tight">Preguntas Frecuentes</h2>
                <div className="space-y-4">
                    {data.map((item, i) => {
                        const isOpen = openIndex === i
                        return (
                            <div
                                key={i}
                                className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => setOpenIndex(isOpen ? null : i)}
                            >
                                <div className="p-6 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-neutral-900">{item.question}</h3>
                                    <div className={`p-2 rounded-full transition-colors ${isOpen ? 'bg-blue-50 text-blue-600' : 'bg-neutral-100 text-neutral-500'}`}>
                                        {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                    </div>
                                </div>
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <p className="px-6 pb-6 text-neutral-500 leading-relaxed text-lg">{item.answer}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

interface FooterProps {
    branding: Branding
    contact: Contact
}

const Footer = ({ branding, contact }: FooterProps) => (
    <footer id="contact" className="bg-neutral-950 text-white py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 md:col-span-2 space-y-8">
                <div className="font-bold text-3xl tracking-tighter flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <Smile className="w-5 h-5 text-white" />
                    </div>
                    {branding.name}
                </div>
                <p className="text-neutral-400 text-lg max-w-sm leading-relaxed">
                    Transformamos vidas a través de sonrisas saludables. Tecnología de punta y atención humana en un solo lugar.
                </p>
                <div className="flex gap-4">
                    {contact.instagram && <a href="#" aria-label="Instagram" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/20 transition-colors"><Instagram className="w-5 h-5" /></a>}
                    {contact.whatsapp && <a href={contact.whatsapp} aria-label="WhatsApp" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/20 transition-colors"><MessageCircle className="w-5 h-5" /></a>}
                </div>
            </div>
            <div className="space-y-6">
                <h4 className="font-bold text-lg">Visítanos</h4>
                <ul className="space-y-4 text-neutral-400">
                    <li className="flex gap-4 items-start">
                        <MapPin className="w-5 h-5 flex-shrink-0 text-blue-500 mt-1" />
                        <span className="leading-relaxed">{contact.address}</span>
                    </li>
                    <li className="flex gap-4 items-center">
                        <Mail className="w-5 h-5 flex-shrink-0 text-blue-500" />
                        <span>{contact.email}</span>
                    </li>
                </ul>
            </div>
            <div className="space-y-6">
                <h4 className="font-bold text-lg">Horario</h4>
                <ul className="space-y-3 text-neutral-400">
                    <li className="flex justify-between border-b border-white/5 pb-2"><span>Lun - Vie</span> <span className="text-white">9am - 6pm</span></li>
                    <li className="flex justify-between border-b border-white/5 pb-2"><span>Sábados</span> <span className="text-white">9am - 1pm</span></li>
                </ul>
            </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-sm text-neutral-600">
            <p>&copy; {new Date().getFullYear()} {branding.name}.</p>
            <div className="flex gap-8 mt-4 md:mt-0">
                <a href="#" className="hover:text-white transition-colors">Privacidad</a>
                <a href="#" className="hover:text-white transition-colors">Términos</a>
            </div>
        </div>
    </footer>
)

const WhatsAppButton = ({ link }: { link: string }) => (
    <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-8 right-8 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 flex items-center justify-center group"
    >
        <MessageCircle className="w-8 h-8 fill-current" />
        <span className="absolute right-full mr-4 bg-white text-neutral-900 px-3 py-1 rounded-lg text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
            ¡Chatea con nosotros!
        </span>
    </a>
)

// --- Main Container ---
export default function LandingPage() {
    const config = baseConfig as { LANDING_PAGE: LandingPageConfig } // Assertion due to json import
    const { LANDING_PAGE } = config
    const { branding, hero, features, testimonials, contact, aboutUs, faq, sections, team, gallery } = LANDING_PAGE
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Normalize sections flags (default true for core, false for extras)
    const activeSections: SectionFlags = {
        hero: sections?.hero ?? true,
        about: sections?.about ?? true,
        features: sections?.features ?? true,
        testimonials: sections?.testimonials ?? true,
        contact: sections?.contact ?? true,
        faq: sections?.faq ?? true,
        team: sections?.team ?? false,
        gallery: sections?.gallery ?? false
    }

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)

    return (
        <div className="min-h-screen bg-white font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white relative">
            <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            <Navbar
                branding={branding}
                sections={activeSections}
                isMobileMenuOpen={isMobileMenuOpen}
                toggleMenu={toggleMenu}
            />

            {activeSections.hero && <Hero data={hero} />}
            {activeSections.about && aboutUs && <About data={aboutUs} />}
            {activeSections.team && team && <Team data={team} />}
            {activeSections.features && <Features data={features} />}
            {activeSections.gallery && gallery && <Gallery data={gallery} />}
            {activeSections.testimonials && <Testimonials data={testimonials} />}
            {activeSections.faq && faq && <FAQ data={faq} />}
            {activeSections.contact && <Footer branding={branding} contact={contact} />}

            {contact.whatsapp && <WhatsAppButton link={contact.whatsapp} />}
        </div>
    )
}
