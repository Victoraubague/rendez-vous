import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Appointment {
  id: string;
  title: string;
  start: Date;
  end: Date;
  clientName: string;
  clientEmail: string;
  description?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private appointments: Appointment[] = [
    {
      id: '1',
      title: 'Consultation Dr. Martin',
      start: new Date(2025, 0, 15, 9, 0),
      end: new Date(2025, 0, 15, 10, 0),
      clientName: 'Marie Dupont',
      clientEmail: 'marie.dupont@email.com',
      description: 'Consultation de suivi',
      status: 'confirmed'
    },
    {
      id: '2',
      title: 'Rendez-vous urgent',
      start: new Date(2025, 0, 16, 14, 30),
      end: new Date(2025, 0, 16, 15, 30),
      clientName: 'Jean Durand',
      clientEmail: 'jean.durand@email.com',
      description: 'Consultation d\'urgence',
      status: 'confirmed'
    },
    {
      id: '3',
      title: 'Consultation Mme Lefebvre',
      start: new Date(2025, 0, 17, 11, 0),
      end: new Date(2025, 0, 17, 12, 0),
      clientName: 'Sophie Lefebvre',
      clientEmail: 'sophie.lefebvre@email.com',
      description: 'Première consultation',
      status: 'pending'
    }
  ];

  private businessHours = {
    start: '08:00',
    end: '18:00',
    daysOfWeek: [1, 2, 3, 4, 5] // Lundi à Vendredi
  };

  constructor() { }

  getAppointments(): Observable<Appointment[]> {
    return of(this.appointments);
  }

  getAppointmentById(id: string): Observable<Appointment | undefined> {
    const appointment = this.appointments.find(apt => apt.id === id);
    return of(appointment);
  }

  addAppointment(appointment: Omit<Appointment, 'id'>): Observable<Appointment> {
    const newAppointment: Appointment = {
      ...appointment,
      id: this.generateId()
    };
    this.appointments.push(newAppointment);
    return of(newAppointment);
  }

  updateAppointment(id: string, updates: Partial<Appointment>): Observable<Appointment | null> {
    const index = this.appointments.findIndex(apt => apt.id === id);
    if (index !== -1) {
      this.appointments[index] = { ...this.appointments[index], ...updates };
      return of(this.appointments[index]);
    }
    return of(null);
  }

  deleteAppointment(id: string): Observable<boolean> {
    const index = this.appointments.findIndex(apt => apt.id === id);
    if (index !== -1) {
      this.appointments.splice(index, 1);
      return of(true);
    }
    return of(false);
  }

  getAvailableTimeSlots(date: Date): Observable<TimeSlot[]> {
    const slots: TimeSlot[] = [];
    const startHour = 8;
    const endHour = 18;
    
    // Vérifier les rendez-vous existants pour cette date
    const dayAppointments = this.appointments.filter(apt => 
      apt.start.toDateString() === date.toDateString()
    );

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, minute, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + 30);

        // Vérifier si le créneau est libre
        const isAvailable = !dayAppointments.some(apt => 
          (slotStart >= apt.start && slotStart < apt.end) ||
          (slotEnd > apt.start && slotEnd <= apt.end) ||
          (slotStart <= apt.start && slotEnd >= apt.end)
        );

        slots.push({
          start: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          end: `${slotEnd.getHours().toString().padStart(2, '0')}:${slotEnd.getMinutes().toString().padStart(2, '0')}`,
          available: isAvailable
        });
      }
    }

    return of(slots);
  }

  getBusinessHours() {
    return this.businessHours;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
