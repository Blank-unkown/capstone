import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnswerSheetGeneratorPage } from './answer-sheet-generator.page';

describe('AnswerSheetGeneratorPage', () => {
  let component: AnswerSheetGeneratorPage;
  let fixture: ComponentFixture<AnswerSheetGeneratorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AnswerSheetGeneratorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
