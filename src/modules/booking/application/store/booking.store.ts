
import { create } from 'zustand'

export type BookingStep = 'SERVICE' | 'DATE' | 'DETAILS' | 'CONFIRMATION';

interface BookingState {
    step: BookingStep;
    serviceId: string | null;
    selectedDate: Date | null;
    selectedTime: string | null; // HH:mm
    patientDetails: {
        name: string;
        email: string;
        phone: string;
    };

    // Actions
    setStep: (step: BookingStep) => void;
    selectService: (serviceId: string) => void;
    selectDate: (date: Date | null) => void;
    selectTime: (time: string | null) => void;
    setPatientDetails: (details: Partial<BookingState['patientDetails']>) => void;
    reset: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
    step: 'SERVICE',
    serviceId: null,
    selectedDate: null,
    selectedTime: null,
    patientDetails: {
        name: '',
        email: '',
        phone: ''
    },

    setStep: (step) => set({ step }),
    selectService: (serviceId) => set({ serviceId, step: 'DATE' }), // Auto-advance? Maybe
    selectDate: (date) => set({ selectedDate: date, selectedTime: null }), // Reset time on date change
    selectTime: (time) => set({ selectedTime: time }),
    setPatientDetails: (details) => set((state) => ({
        patientDetails: { ...state.patientDetails, ...details }
    })),
    reset: () => set({
        step: 'SERVICE',
        serviceId: null,
        selectedDate: null,
        selectedTime: null,
        patientDetails: { name: '', email: '', phone: '' }
    })
}))
