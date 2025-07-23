import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LocalDataService } from '../../services/local-data.service';

@Component({
  selector: 'app-answer-key',
  templateUrl: './answer-key.page.html',
  styleUrls: ['./answer-key.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule]
})
export class AnswerKeyPage implements OnInit {
  classId!: number;
  subjectId!: number;
  totalQuestions = 0;
  answerKey: string[] = [];
  options = ['A', 'B', 'C', 'D'];
  

  constructor(private route: ActivatedRoute) {}

ngOnInit() {
  this.classId = Number(this.route.snapshot.paramMap.get('classId'));
  this.subjectId = Number(this.route.snapshot.paramMap.get('subjectId'));

  const subject = LocalDataService.getSubject(this.classId, this.subjectId);
  if (!subject) {
    alert("Subject not found. Maybe localStorage is empty.");
    return;
  }

  const tos = subject.tos || [];
  console.log('Loaded TOS:', tos);

  this.totalQuestions = tos.reduce((sum, t) => sum + (t.expectedItems || 0), 0);
  console.log('Total Questions:', this.totalQuestions);

  this.answerKey = new Array(this.totalQuestions).fill('').map((_, i) => subject.answerKey?.[i] || '');
  console.log('Loaded answer key:', this.answerKey);
}


  setAnswer(index: number, option: string) {
    this.answerKey[index] = option;
  }

  trackByIndex(index: number, item: any): number {
  return index;
}


  saveAnswerKey() {
    const subject = LocalDataService.getSubject(this.classId, this.subjectId);
    if (subject) {
      subject.answerKey = this.answerKey;
      LocalDataService.save();
      alert('Answer key saved!');
    }
  }
}
