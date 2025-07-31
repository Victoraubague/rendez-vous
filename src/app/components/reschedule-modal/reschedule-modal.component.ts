import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { CalendarService, Appointment, TimeSlot } from '../../services/calendar.service';

export interface RescheduleDialogData {
  appointment: Appointment;
}

@Component({
  selector: 'app-reschedule-modal',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButton,
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatNativeDateModule,
    MatRadioGroup,
    MatRadioButton,
    MatIcon
  ],
  templateUrl: './reschedule-modal.component.html',
  styleUrl: './reschedule-modal.component.scss'
})
export class RescheduleModalComponent implements OnInit {
  rescheduleForm: FormGroup;
  availableSlots: TimeSlot[] = [];
  selectedDate: Date | null = null;
  isLoading = false;
  minDate = new Date();

  constructor(
    public dialogRef: MatDialogRef<RescheduleModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RescheduleDialogData,
    private fb: FormBuilder,
    private calendarService: CalendarService
  ) {
    this.rescheduleForm = this.fb.group({
      selectedDate: ['', Validators.required],
      selectedTimeSlot: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Écouter les changements de date
    this.rescheduleForm.get('selectedDate')?.valueChanges.subscribe(date => {
      if (date) {
        this.selectedDate = date;
        this.loadAvailableSlots(date);
        // Réinitialiser la sélection du créneau
        this.rescheduleForm.get('selectedTimeSlot')?.setValue('');
      }
    });
  }

  loadAvailableSlots(date: Date): void {
    this.isLoading = true;
    this.calendarService.getAvailableTimeSlots(date).subscribe({
      next: (slots) => {
        this.availableSlots = slots.filter(slot => slot.available);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des créneaux:', error);
        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.rescheduleForm.valid && this.selectedDate) {
      const formValue = this.rescheduleForm.value;
      const selectedSlot = formValue.selectedTimeSlot;
      
      // Créer les nouvelles dates
      const startTime = this.parseTimeSlot(selectedSlot.start);
      const endTime = this.parseTimeSlot(selectedSlot.end);
      
      const newStartDate = new Date(this.selectedDate);
      newStartDate.setHours(startTime.hours, startTime.minutes, 0, 0);
      
      const newEndDate = new Date(this.selectedDate);
      newEndDate.setHours(endTime.hours, endTime.minutes, 0, 0);

      // Retourner les nouvelles données
      this.dialogRef.close({
        newStartDate,
        newEndDate,
        slot: selectedSlot
      });
    }
  }

  private parseTimeSlot(timeString: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeString.split(':').map(num => parseInt(num, 10));
    return { hours, minutes };
  }

  // Filtrer les dates (pas de weekend)
  dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    const day = date.getDay();
    return day !== 0 && day !== 6;
  };

  hasError(controlName: string, errorName: string): boolean {
    const control = this.rescheduleForm.get(controlName);
    return !!(control?.hasError(errorName) && control?.touched);
  }

  getErrorMessage(controlName: string): string {
    const control = this.rescheduleForm.get(controlName);
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Ce champ est requis';
    }
    return '';
  }
}
