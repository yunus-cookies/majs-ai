import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Customerfield } from './customerfield';

describe('Customerfield', () => {
  let component: Customerfield;
  let fixture: ComponentFixture<Customerfield>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Customerfield]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Customerfield);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
