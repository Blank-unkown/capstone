import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LocalDataService, TopicEntry } from '../../services/local-data.service';

@Component({
  selector: 'app-question-generator',
  templateUrl: './question-generator.page.html',
  styleUrls: ['./question-generator.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class QuestionGeneratorPage implements OnInit {
  classId!: number;
  subjectId!: number;
  className = '';
  subjectName = '';
  questions: {
    topic: string;
    competency: string;
    level: string;
    question: string;
  }[] = [];

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.classId = Number(this.route.snapshot.paramMap.get('classId'));
    this.subjectId = Number(this.route.snapshot.paramMap.get('subjectId'));

    const cls = LocalDataService.getClass(this.classId);
    const subject = LocalDataService.getSubject(this.classId, this.subjectId);
    const tos = subject?.tos || [];

    this.className = cls?.name || '';
    this.subjectName = subject?.name || '';

    this.generateQuestions(tos);
  }

  generateQuestions(tos: TopicEntry[]) {
    const cognitiveLevels = [
      'remembering',
      'understanding',
      'applying',
      'analyzing',
      'evaluating',
      'creating'
    ];

    tos.forEach((entry) => {
      cognitiveLevels.forEach((level) => {
        const count = Number(entry[level as keyof TopicEntry] || 0);
        for (let i = 1; i <= count; i++) {
          this.questions.push({
            topic: entry.topicName,
            competency: entry.learningCompetency,
            level: level,
            question: `(${level}) ${entry.topicName} - ${entry.learningCompetency} - Q${i}`
          });
        }
      });
    });
  }

  saveQuestions() {
    const subject = LocalDataService.getSubject(this.classId, this.subjectId);
    if (subject) {
      subject.questions = this.questions;
      LocalDataService.save();
      alert('Questions saved!');
    }
  }
}
