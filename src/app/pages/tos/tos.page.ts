import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LocalDataService, TopicEntry } from '../../services/local-data.service';
import { AnswerSheetGeneratorPage } from '../answer-sheet-generator/answer-sheet-generator.page';

@Component({
  selector: 'app-tos',
  templateUrl: './tos.page.html',
  styleUrls: ['./tos.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AnswerSheetGeneratorPage, RouterModule] 
})
export class TosPage implements OnInit {
  classId!: number;
  subjectId!: number;
  className = '';
  subjectName = '';
  viewMode: 'edit' | 'print' | 'answersheet' = 'edit';

  tos: TopicEntry[] = [];
  totalItems = 0;
getTotal(field: keyof TopicEntry): number {
  return this.tos.reduce((sum, topic) => sum + (Number(topic[field]) || 0), 0);
}

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.classId = Number(this.route.snapshot.paramMap.get('classId'));
    this.subjectId = Number(this.route.snapshot.paramMap.get('subjectId'));

    const cls = LocalDataService.getClass(this.classId);
    const subject = LocalDataService.getSubject(this.classId, this.subjectId);

    this.className = cls?.name || '';
    this.subjectName = subject?.name || '';
    this.tos = subject?.tos || [];

    this.totalItems = this.tos.reduce((sum, row) => {
      return (
        sum +
        (row.remembering || 0) +
        (row.understanding || 0) +
        (row.applying || 0) +
        (row.analyzing || 0) +
        (row.evaluating || 0) +
        (row.creating || 0)
      );
    }, 0);
  }

  setMode(mode: 'edit' | 'print' | 'answersheet') {
    this.viewMode = mode;

    // Automatically trigger print when entering print mode
    if (mode === 'print') {
      setTimeout(() => {
        window.print();
      }, 300);
    }
  }
  addTopicRow() {
  this.tos.push({
    topicName: '',
    learningCompetency: '',
    days: 0,
    percent: 0,
    expectedItems: 0,
    remembering: 0,
    understanding: 0,
    applying: 0,
    analyzing: 0,
    evaluating: 0,
    creating: 0
  });
  }

}
