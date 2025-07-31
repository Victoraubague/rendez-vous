import { Component, OnInit } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventApi, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarService, Appointment } from '../../services/calendar.service';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calendar',
  imports: [
    FullCalendarModule,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatButton,
    MatIcon,
    CommonModule
  ],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent implements OnInit {
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    initialView: 'dayGridMonth',
    weekends: true,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    businessHours: {
      daysOfWeek: [1, 2, 3, 4, 5],
      startTime: '08:00',
      endTime: '18:00'
    },
    locale: 'fr',
    slotMinTime: '08:00:00',
    slotMaxTime: '18:00:00',
    height: 'auto',
    events: [],
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventsSet: this.handleEvents.bind(this)
  };

  currentEvents: EventApi[] = [];

  constructor(private calendarService: CalendarService) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.calendarService.getAppointments().subscribe(appointments => {
      const events: EventInput[] = appointments.map(apt => ({
        id: apt.id,
        title: apt.title,
        start: apt.start,
        end: apt.end,
        backgroundColor: this.getEventColor(apt.status),
        borderColor: this.getEventColor(apt.status),
        extendedProps: {
          clientName: apt.clientName,
          clientEmail: apt.clientEmail,
          description: apt.description,
          status: apt.status
        }
      }));

      this.calendarOptions = {
        ...this.calendarOptions,
        events: events
      };
    });
  }

  handleDateSelect(selectInfo: any): void {
    const title = prompt('Entrez le titre du rendez-vous:');
    const calendarApi = selectInfo.view.calendar;

    calendarApi.unselect();

    if (title) {
      const newAppointment: Omit<Appointment, 'id'> = {
        title,
        start: selectInfo.start,
        end: selectInfo.end,
        clientName: 'Client temporaire',
        clientEmail: 'temp@email.com',
        description: 'Rendez-vous créé depuis le calendrier',
        status: 'pending'
      };

      this.calendarService.addAppointment(newAppointment).subscribe(appointment => {
        calendarApi.addEvent({
          id: appointment.id,
          title: appointment.title,
          start: appointment.start,
          end: appointment.end,
          backgroundColor: this.getEventColor(appointment.status),
          borderColor: this.getEventColor(appointment.status),
          extendedProps: {
            clientName: appointment.clientName,
            clientEmail: appointment.clientEmail,
            description: appointment.description,
            status: appointment.status
          }
        });
      });
    }
  }

  handleEventClick(clickInfo: any): void {
    const event = clickInfo.event;
    const details = `
      Titre: ${event.title}
      Client: ${event.extendedProps.clientName}
      Email: ${event.extendedProps.clientEmail}
      Statut: ${event.extendedProps.status}
      Description: ${event.extendedProps.description || 'Aucune'}
      
      Voulez-vous supprimer ce rendez-vous ?
    `;

    if (confirm(details)) {
      this.calendarService.deleteAppointment(event.id).subscribe(success => {
        if (success) {
          event.remove();
        }
      });
    }
  }

  handleEvents(events: EventApi[]): void {
    this.currentEvents = events;
  }

  private getEventColor(status: string): string {
    switch (status) {
      case 'confirmed':
        return '#4caf50';
      case 'pending':
        return '#ff9800';
      case 'cancelled':
        return '#f44336';
      default:
        return '#2196f3';
    }
  }

  // Méthodes pour changer de vue
  changeToMonthView(): void {
    const calendarApi = document.querySelector('full-calendar') as any;
    if (calendarApi) {
      calendarApi.getApi().changeView('dayGridMonth');
    }
  }

  changeToWeekView(): void {
    const calendarApi = document.querySelector('full-calendar') as any;
    if (calendarApi) {
      calendarApi.getApi().changeView('timeGridWeek');
    }
  }

  changeToDayView(): void {
    const calendarApi = document.querySelector('full-calendar') as any;
    if (calendarApi) {
      calendarApi.getApi().changeView('timeGridDay');
    }
  }
}
