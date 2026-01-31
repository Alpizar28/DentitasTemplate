'use server'

import { SupabaseService } from '@/shared/infrastructure/supabase.client';
import { SupabaseBookingRepository } from '@/modules/booking/infrastructure/repositories/supabase-booking.repository';
import { AvailabilityService } from '@/modules/booking/application/services/availability.service';
import { SmartAvailabilityService } from '@/modules/booking/application/services/smart-availability.service';
import { TimeSlotRequest } from '@/modules/booking/domain/value-objects/time-slot-request.vo';
import { BookingActor } from '@/modules/booking/domain/value-objects/booking-actor.vo';
import { PolicyEngineService } from '@/modules/booking/application/services/policy-engine.service';
import { PolicyRegistry } from '@/modules/booking/application/extensions/policy.registry';
import { ConfigService } from '@/modules/booking/application/configuration/config.service';
import { SupabaseConfigRepository } from '@/modules/booking/infrastructure/configuration/supabase-config.repository';
import * as ConfigTypes from '@/modules/booking/application/configuration/config.types';
import baseConfig from '../../seeds/base-config.json';
import { revalidatePath } from 'next/cache';

// --- FACTORY (Wiring) ---
function getServices() {
    const client = SupabaseService.getClient();
    const bookingRepo = new SupabaseBookingRepository(client);
    const configRepo = new SupabaseConfigRepository(client);

    // Config Service
    const configService = new ConfigService(configRepo, baseConfig as any, 'development');
    // Note: 'development' hardcoded for playground. In real app, use env var.

    // Policy Engine
    const registry = new PolicyRegistry(configService);

    return { bookingRepo, configService, registry };
}

// --- ACTIONS ---

export async function getAvailabilityAction(resourceId: string, dateIso: string) {
    const { bookingRepo, configService } = getServices();
    await configService.load(); // Override defaults with DB/Env

    const configSettings = await configService.getPolicyParams<any>('SERVICE_DEFAULT'); // Try load service config

    // M2: Use Smart Engine
    const smartService = new SmartAvailabilityService(bookingRepo, configService);

    // Hardcoded Service Config for now (M2 Design)
    const serviceConfig = {
        durationMinutes: 60,
        granularityMinutes: 60,
        bufferAfterMinutes: 0,
        ...configSettings
    };

    try {
        const date = new Date(dateIso);
        // Range: Full Day 00:00 - 23:59 (Engine will filter by Schedule)
        // Fix: Use UTC-aware date parsing if dateIso implies UTC, or careful timezone handling.
        // For now, assume dateIso "YYYY-MM-DD" creates a Date at 00:00 UTC.
        // But setHours operates in Local Time of the server unless using setUTCHours.

        // Better approach for full day range:
        // Use the start of the day in the configured Timezone?
        // Or simply cover 00:00 to 23:59 of the given date string interpreted as local date.

        // Let's create dates explicitely from the string components to avoid TZ shifts
        const [year, month, day] = dateIso.split('-').map(Number);
        const start = new Date(year, month - 1, day, 0, 0, 0, 0);
        const end = new Date(year, month - 1, day, 23, 59, 59, 999);

        console.log(`[getAvailabilityAction] Request for ${resourceId} on ${dateIso}`);
        console.log(`[getAvailabilityAction] Range: ${start.toISOString()} - ${end.toISOString()}`);
        console.log(`[getAvailabilityAction] ServiceConfig:`, JSON.stringify(serviceConfig));

        const slots = await smartService.getSlots(resourceId, start, end, serviceConfig);
        console.log(`[getAvailabilityAction] Found ${slots.length} slots`);
        return { success: true, data: slots };
    } catch (error: any) {
        console.error('[getAvailabilityAction] FATAL ERROR:', error);
        if (error instanceof Error) console.error(error.stack);
        return { success: false, error: error.message };
    }
}

export async function createBookingAction(data: {
    serviceId: string;
    date: Date;
    time: string;
    patient: {
        name: string;
        email: string;
        phone: string;
        notes?: string;
    }
}) {
    // 1. Validation
    if (!data.serviceId || !data.date || !data.time || !data.patient.email) {
        return { success: false, error: 'Datos incompletos para la reserva.' };
    }

    // Dummy Resource ID (Must match what frontend uses)
    const resourceId = "00000000-0000-0000-0000-000000000001";

    // 2. Parse Date/Time to ISO Start/End
    // data.date is a Date object (UTC 00:00 usually if strictly serialized, or string if over network)
    // Server Actions serialization converts Date -> String (ISO).
    // Let's ensure we handle it.

    try {
        const { bookingRepo, configService, registry } = getServices();
        await configService.load();

        // Parse "HH:mm"
        const [hours, minutes] = data.time.split(':').map(Number);

        // Create Start Date
        // We take the date part from data.date and time from data.time
        const dateObj = new Date(data.date);
        // If dateObj is 00:00 UTC, we need to be careful.
        // Let's assume the system timezone logic handles it, OR we construct explicitly in UTC ?
        // For simplicity: Create a new Date from date string + time string.

        const year = dateObj.getFullYear();
        const month = dateObj.getMonth();
        const day = dateObj.getDate();

        // Construct start time. 
        // Note: new Date(year, month, day, hours, minutes) creates LOCAL time.
        // We want to verify availability in the configured timezone.
        // But the booking REPO expects ISO string (UTC).
        // Let's assume input 'time' (e.g. "09:00") is in the Business Timezone.
        // We need to convert Business Time -> UTC.

        // FAST PATH: Construct string "YYYY-MM-DDTHH:mm:00" and let Date parse it as Local (or append Z if UTC).
        // The slot returned by availability engine was ISO (UTC).
        // So we should ideally rely on the slot start time directly if we had it.
        // But we only have date + time.

        // Let's use date-fns-tz or simple construction assuming server matches business time for now, 
        // or just construct UTC if we know the offset. 
        // For this template, we'll assume the provided date/time IS the target start time.

        // Fix: dateObj from client might be UTC 00:00.
        // "2026-02-02"
        const dateStr = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD safely
        const startIsoLocal = `${dateStr}T${data.time}:00`;

        // TODO: Proper Timezone conversion. For now, we assume Config Timezone = Server Timezone or use UTC.
        const start = new Date(startIsoLocal);
        const end = new Date(start.getTime() + 60 * 60 * 1000); // 60 min hardcoded service duration

        // 3. Create Request
        const request = new TimeSlotRequest({
            resourceId,
            start: start.toISOString(),
            end: end.toISOString(),
            type: 'CUSTOMER_BOOKING',
            metadata: {
                serviceId: data.serviceId,
            }
        });

        // 4. Create Actor from Patient Data
        const actor = BookingActor.create('CUSTOMER', data.patient.email, {
            name: data.patient.name,
            phone: data.patient.phone,
            email: data.patient.email,
            notes: data.patient.notes
        });

        // 5. Policy Check
        const policies = await registry.getActivePolicies();
        const engine = new PolicyEngineService(policies);

        const policyResult = await engine.evaluate('CREATE_HOLD', {
            command: 'CREATE_HOLD',
            actor,
            timeNow: new Date(),
            request,
            metadata: { resourceId }
        });

        if (policyResult.decision?.status !== 'ALLOW') {
            return {
                success: false,
                error: policyResult.decision?.message || 'Reglas de negocio impiden la reserva.'
            };
        }

        // 6. Execute HOLD (Expires in 30 mins)
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        const booking = await bookingRepo.createHold(request, actor, expiresAt);

        return { success: true, bookingId: booking.id };

    } catch (e: any) {
        console.error("Create Booking Error:", e);
        return { success: false, error: e.message || "Error interno al crear reserva." };
    }
}

export async function confirmBookingAction(bookingId: string) {
    const { bookingRepo } = getServices();
    try {
        await bookingRepo.confirm(bookingId);
        revalidatePath('/playground/bookings');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function cancelBookingAction(bookingId: string) {
    const { bookingRepo } = getServices();
    try {
        await bookingRepo.cancel(bookingId, 'Cancelled from Playground');
        revalidatePath('/playground/bookings');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function listBookingsAction() {
    // Direct Supabase query for list
    const client = SupabaseService.getClient();
    const { data, error } = await client
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}
