import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { SchoolService } from '../../services/school.service';
import { AnswerKeyService } from '../../services/answer-key.service';
import { TosService } from '../../services/tos.service';  // ✅ import TosService
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-answer-key',
  templateUrl: './answer-key.page.html',
  styleUrls: ['./answer-key.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule],
})
export class AnswerKeyPage implements OnInit {
  classId!: number;
  subjectId!: number;
  className = '';
  subjectName = '';
  totalQuestions = 0;
  answerKey: string[] = [];
  options = ['A', 'B', 'C', 'D'];

  constructor(
    private route: ActivatedRoute,
    private schoolService: SchoolService,
    private http: HttpClient,
    private answerKeyService: AnswerKeyService,
    private tosService: TosService, 
    private authService: AuthService,   // ✅ add this
  ) {}

  ngOnInit() {
  this.classId = Number(this.route.snapshot.paramMap.get('classId'));
  this.subjectId = Number(this.route.snapshot.paramMap.get('subjectId'));

   const userId = this.authService.getCurrentUserId();
  this.schoolService.getClassById(this.classId, userId).subscribe(cls => {
    this.className = cls.name;
  });
  // Fetch subject name
  this.schoolService.getSubjectById(this.classId, this.subjectId).subscribe(subject => {
    this.subjectName = subject?.name || '';
  });

  // Fetch TOS first (to know how many questions)
  this.tosService.getTOS(this.classId, this.subjectId).subscribe((tos: any[]) => {
    this.totalQuestions = tos.reduce((sum, t) => sum + (t.expectedItems || 0), 0);

    // Fetch Answer Key (with service)
    this.answerKeyService.getAnswerKey(this.classId, this.subjectId).subscribe(rows => {
      this.answerKey = new Array(this.totalQuestions).fill('');

      rows.forEach(r => {
        const index = r.question_number - 1;
        if (index >= 0 && index < this.totalQuestions) {
          this.answerKey[index] = r.correct_answer || '';
        }
      });
    });
  });
}

  loadAnswerKey() {
    this.answerKeyService
      .getAnswerKey(this.classId, this.subjectId)
      .subscribe(
        rows => {
          // initialize with empty values first
          this.answerKey = new Array(this.totalQuestions).fill('');
          rows.forEach(r => {
            this.answerKey[r.question_number - 1] = r.correct_answer || '';
          });
        },
        err => {
          console.error('Failed to fetch answer key:', err);
          // fallback: just empty array with placeholders
          this.answerKey = new Array(this.totalQuestions).fill('');
        }
      );
  }

  setAnswer(index: number, option: string) {
    this.answerKey[index] = option;
  }

  saveAnswerKey() {
    this.answerKeyService
      .saveAnswerKey(this.classId, this.subjectId, this.answerKey)
      .subscribe(
        () => {
          alert('✅ Answer key saved!');
        },
        err => {
          console.error('Failed to save answer key:', err);
          alert('⚠️ Failed to save answer key');
        }
      );
  }

  // ✅ Needed for *ngFor trackBy
  trackByIndex(index: number, item: any): number {
    return index;
  }
}
