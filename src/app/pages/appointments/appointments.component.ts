import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatChip, MatChipSet } from '@angular/material/chips';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect, MatOption } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatMenu, MatMenuTrigger, MatMenuItem } from '@angular/material/menu';
import { CalendarService, Appointment } from '../../services/calendar.service';
import { RescheduleModalComponent, RescheduleDialogData } from '../../components/reschedule-modal/reschedule-modal.component';

@Component({
  selector: 'app-appointments',
  imports: [
    CommonModule,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatButton,
    MatIconButton,
    MatIcon,
    MatChip,
    MatChipSet,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatMenu,
    MatMenuTrigger,
    MatMenuItem
  ],
  templateUrl: './appointments.component.html',
  styleUrl: './appointments.component.scss'
})
export class AppointmentsComponent implements OnInit {
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  isLoading = false;
  
  // Filtres
  statusFilter: string = 'all';
  sortBy: string = 'date-asc';

  constructor(
    private calendarService: CalendarService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.isLoading = true;
    this.calendarService.getAppointments().subscribe({
      next: (appointments) => {
        this.appointments = appointments;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des rendez-vous:', error);
        this.isLoading = false;
        this.snackBar.open('Erreur lors du chargement des rendez-vous', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.appointments];

    // Filtre par statut
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === this.statusFilter);
    }

    // Tri
    switch (this.sortBy) {
      case 'date-asc':
        filtered.sort((a, b) => a.start.getTime() - b.start.getTime());
        break;
      case 'date-desc':
        filtered.sort((a, b) => b.start.getTime() - a.start.getTime());
        break;
      case 'client-asc':
        filtered.sort((a, b) => a.clientName.localeCompare(b.clientName));
        break;
      case 'client-desc':
        filtered.sort((a, b) => b.clientName.localeCompare(a.clientName));
        break;
    }

    this.filteredAppointments = filtered;
  }

  onStatusFilterChange(status: string): void {
    this.statusFilter = status;
    this.applyFilters();
  }

  onSortChange(sortBy: string): void {
    this.sortBy = sortBy;
    this.applyFilters();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'primary';
      case 'pending':
        return 'accent';
      case 'cancelled':
        return 'warn';
      default:
        return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'Confirmé';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'check_circle';
      case 'pending':
        return 'schedule';
      case 'cancelled':
        return 'cancel';
      default:
        return 'help';
    }
  }

  isPastAppointment(appointment: Appointment): boolean {
    return appointment.start < new Date();
  }

  canCancelAppointment(appointment: Appointment): boolean {
    return appointment.status !== 'cancelled' && !this.isPastAppointment(appointment);
  }

  canRescheduleAppointment(appointment: Appointment): boolean {
    return appointment.status !== 'cancelled' && !this.isPastAppointment(appointment);
  }

  cancelAppointment(appointment: Appointment): void {
    const message = `Êtes-vous sûr de vouloir annuler le rendez-vous du ${appointment.start.toLocaleDateString()} à ${appointment.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ?`;
    
    if (confirm(message)) {
      this.calendarService.updateAppointment(appointment.id, { status: 'cancelled' }).subscribe({
        next: (updatedAppointment) => {
          if (updatedAppointment) {
            this.snackBar.open('Rendez-vous annulé avec succès', 'Fermer', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadAppointments(); // Recharger la liste
          }
        },
        error: (error) => {
          console.error('Erreur lors de l\'annulation:', error);
          this.snackBar.open('Erreur lors de l\'annulation', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  rescheduleAppointment(appointment: Appointment): void {
    const dialogData: RescheduleDialogData = { appointment };
    
    const dialogRef = this.dialog.open(RescheduleModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: dialogData,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Mettre à jour le rendez-vous avec les nouvelles dates
        const updates = {
          start: result.newStartDate,
          end: result.newEndDate
        };

        this.calendarService.updateAppointment(appointment.id, updates).subscribe({
          next: (updatedAppointment) => {
            if (updatedAppointment) {
              this.snackBar.open('Rendez-vous reprogrammé avec succès', 'Fermer', {
                duration: 5000,
                panelClass: ['success-snackbar']
              });
              this.loadAppointments(); // Recharger la liste
            }
          },
          error: (error) => {
            console.error('Erreur lors de la reprogrammation:', error);
            this.snackBar.open('Erreur lors de la reprogrammation', 'Fermer', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  getAppointmentsByStatus() {
    return {
      all: this.appointments.length,
      confirmed: this.appointments.filter(apt => apt.status === 'confirmed').length,
      pending: this.appointments.filter(apt => apt.status === 'pending').length,
      cancelled: this.appointments.filter(apt => apt.status === 'cancelled').length
    };
  }
}
