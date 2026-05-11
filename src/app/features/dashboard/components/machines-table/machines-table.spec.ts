import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MachinesTable } from './machines-table';

describe('MachinesTable', () => {
  let component: MachinesTable;
  let fixture: ComponentFixture<MachinesTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MachinesTable],
    }).compileComponents();

    fixture = TestBed.createComponent(MachinesTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
