import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubjectListPage } from './subject-list.page';

describe('SubjectListPage', () => {
  let component: SubjectListPage;
  let fixture: ComponentFixture<SubjectListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SubjectListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
