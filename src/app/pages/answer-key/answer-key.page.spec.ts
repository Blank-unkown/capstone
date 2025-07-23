import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnswerKeyPage } from './answer-key.page';

describe('AnswerKeyPage', () => {
  let component: AnswerKeyPage;
  let fixture: ComponentFixture<AnswerKeyPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AnswerKeyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
