import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RescheduleModalComponent } from './reschedule-modal.component';

describe('RescheduleModalComponent', () => {
  let component: RescheduleModalComponent;
  let fixture: ComponentFixture<RescheduleModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RescheduleModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RescheduleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
