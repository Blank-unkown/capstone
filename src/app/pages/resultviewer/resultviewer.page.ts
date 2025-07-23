import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { LocalDataService, ScannedResult } from '../../services/local-data.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-resultviewer',
  templateUrl: './resultviewer.page.html',
  styleUrls: ['./resultviewer.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class ResultviewerPage implements OnInit, AfterViewInit {
  classId!: number;
  subjectId!: number;
  resultId!: number;
  result?: ScannedResult;
  cognitiveBreakdown: { [level: string]: { correct: number; total: number } } = {};

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.classId = +params['classId'];
      this.subjectId = +params['subjectId'];
      this.resultId = +params['resultId'];

      const subject = LocalDataService.getSubject(this.classId, this.subjectId);
      this.result = subject?.results?.find(r => r.id === this.resultId);

      if (this.result) {
        this.generateCognitiveBreakdown();
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.result) {
        this.renderChart();
      }
    }, 500); // wait for view to render
  }

  generateCognitiveBreakdown() {
    const subject = LocalDataService.getSubject(this.classId, this.subjectId);
    if (!subject || !subject.tos || !subject.answerKey) return;

    const tosMap = LocalDataService.generateTOSMap(subject.tos);
    const answers = this.result?.answers || [];
    const answerKey = subject.answerKey;

    const breakdown: { [level: string]: { correct: number; total: number } } = {};

    tosMap.forEach((q, index) => {
      const level = q.level;
      breakdown[level] = breakdown[level] || { correct: 0, total: 0 };
      breakdown[level].total++;

      if (answers[index] && answers[index] === answerKey[index]) {
        breakdown[level].correct++;
      }
    });

    this.cognitiveBreakdown = breakdown;
  }

  getBreakdownKeys() {
    return Object.keys(this.cognitiveBreakdown);
  }

  renderChart() {
    const ctx = document.getElementById('cognitiveChart') as HTMLCanvasElement;
    if (!ctx || !this.result) return;

    const labels = this.getBreakdownKeys();
    const correct = labels.map(level => this.cognitiveBreakdown[level].correct);
    const total = labels.map(level => this.cognitiveBreakdown[level].total);

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Correct',
            data: correct,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
          },
          {
            label: 'Total',
            data: total,
            backgroundColor: 'rgba(255, 99, 132, 0.3)',
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  printPage() {
    window.print();
  }
}
