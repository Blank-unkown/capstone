import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ScanService } from '../../services/scan.service';
import { TosService } from '../../services/tos.service'; // see simple service below
import { Chart, registerables,ChartConfiguration, ChartItem} from 'chart.js';
Chart.register(...registerables);

// ===== Interfaces mirrored to DB shape =====
export interface AnswerEntry {
  question: number;
  marked: string | null;
  correctAnswer: string | null;
  correct: boolean;
  topic?: string | null;
  competency?: string | null;
  level?: string | null;
}

export interface TopicEntry {
  topicName: string;
  learningCompetency: string;
  percent: number;
  expectedItems?: number;
  remembering?: number;
  understanding?: number;
  applying?: number;
  analyzing?: number;
  evaluating?: number;
  creating?: number;
  startQuestion?: number;
  endQuestion?: number;
}

export interface ScannedResult {
  //classID: number;
  //subjectID: number;
  id: number;
  score: number;
  total: number;
  timestamp: string;
  headerImage?: string | null;
  fullImage?: string | null;
  answers: AnswerEntry[];
  tosRows: TopicEntry[];
}

interface TosRowAnalysis {
  topic: string;
  competency: string;
  percentage: number;
  numItems: number;
  start: number;
  end: number;
  correct: number;
  total: number;
  percentScore: number;
}

@Component({
  selector: 'app-resultviewer',
  templateUrl: './resultviewer.page.html',
  styleUrls: ['./resultviewer.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HttpClientModule],
})
export class ResultviewerPage implements OnInit {

   private charts: { [key: string]: Chart } = {};
@ViewChild('answersChart', { static: false })
answersChartRef!: ElementRef<HTMLCanvasElement>;

@ViewChild('cognitiveChart', { static: false })
cognitiveChartRef!: ElementRef<HTMLCanvasElement>;

@ViewChild('topicChart', { static: false })
topicChartRef!: ElementRef<HTMLCanvasElement>;

@ViewChild('competencyChart', { static: false })
competencyChartRef!: ElementRef<HTMLCanvasElement>;

  classId!: number;
  subjectId!: number;
  resultId!: number;
  result?: ScannedResult;

  tosAnalysis: TosRowAnalysis[] = [];
  tosRowView: any[] = [];

  private cognitiveChart?: Chart;
  private answersChart?: Chart;
  private topicChart?: Chart;
  private competencyChart?: Chart;

  constructor(private route: ActivatedRoute,
    private scanService: ScanService,
    private tosService: TosService,
  ) {}
ngOnInit() {
  this.classId = Number(this.route.snapshot.paramMap.get('classId'));
  this.subjectId = Number(this.route.snapshot.paramMap.get('subjectId'));
  this.resultId = Number(this.route.snapshot.paramMap.get('scanId'));

  console.log('📌 Loaded IDs:', this.classId, this.subjectId, this.resultId);

  this.loadFromDb();
}
private loadFromDb() {
  forkJoin({
    scan: this.scanService.getScan(this.classId, this.subjectId, this.resultId),
    tosRows: this.tosService.getTOS(this.classId, this.subjectId),
  }).subscribe({
    next: ({ scan, tosRows }) => {
      console.log('RAW /scans/:scanId response (scan):', scan);
      console.log('scan.scanAnswers:', scan?.scanAnswers);
      console.log('scan.answers:', scan?.answers);

      const rawAnswers = scan.scanAnswers ?? scan.answers ?? [];

      this.result = {
        id: scan.id,
        score: scan.score ?? 0,
        total: scan.total ?? 0,
        timestamp: scan.timestamp,
        headerImage: scan.header_image ?? null,
        fullImage: scan.full_image ?? null,
        answers: (scan.scanAnswers ?? []).map((a: any) => ({
          question: a.question_number ?? a.question,
          marked: a.marked ?? a.selected_answer ?? null,
          correctAnswer: a.correct_answer ?? a.correctAnswer ?? null,
          correct: !!(a.correct ?? a.is_correct),
          topic: a.topic ?? null,
          competency: a.competency ?? null,
          level: a.level ?? null
        })),

        tosRows: tosRows ?? [],
      };

      console.log("✅ Result loaded (normalized):", this.result);

      this.buildTosAnalysis();
      this.tosRowView = this.result?.tosRows ? this.buildTosRowView(this.result.tosRows) : [];
      this.dataReady = true;
      this.tryRenderCharts();
    },
    error: (err) => {
      console.error('❌ Failed to load scan/TOS from DB:', err);
    }
  });
}

private renderAllCharts() {
  if (!this.result) return;

  // destroy previous charts before recreating
  this.cognitiveChart?.destroy();
  this.answersChart?.destroy();
  this.topicChart?.destroy();
  this.competencyChart?.destroy();

  this.renderAnswerDistributionChart(this.result.answers);
  this.renderCognitiveChart(this.result.answers);
  this.renderTopicChart(this.result.answers);
  this.renderCompetencyChart(this.result.answers);
}
  ngAfterViewInit() {
    // don’t render here — just mark that DOM is ready
    this.viewReady = true;
    this.tryRenderCharts();
  }
private tryRenderCharts() {
  console.log("🔎 tryRenderCharts called", {
    dataReady: this.dataReady,
    viewReady: this.viewReady,
    answers: this.result?.answers?.length
  });
  if (this.dataReady && this.viewReady) {
    console.log("🎨 Rendering charts now!");
    setTimeout(() => this.renderAllCharts(), 0);
  }
}

  private viewReady = false;
  private dataReady = false;

  // ✅ Build TOS Row Analysis
private buildTosAnalysis() {
  if (!this.result || !this.result.tosRows) return;

  let itemCounter = 1; // start counting questions
  this.tosAnalysis = this.result.tosRows.map((row: any) => {
    const start = itemCounter;
    const totalItems = row.expectedItems ?? 0;
    const end = start + totalItems - 1;

    const rowAnswers = (this.result?.answers ?? []).filter(
      a => a.question >= start && a.question <= end
    );

    const correct = rowAnswers.filter(a => a.correct).length;

    itemCounter += totalItems; // advance counter for next row

    return {
      topic: row.topicName,
      competency: row.learningCompetency,
      numItems: totalItems,
      start,
      end,
      correct,
      total: totalItems, // total matches expectedItems
      percentage: row.percent ?? 0, // planned % allocation from DB
      percentScore: totalItems > 0 ? Math.round((correct / totalItems) * 100) : 0 // actual %
    };
  });
}

// ✅ Build TOS Row View
buildTosRowView(tosRows: TopicEntry[]): any[] {
  let itemCounter = 1; // Q1
  const rows: any[] = [];

  for (const row of tosRows) {
    const cognitiveLevels: { level: string; count: number; range: string }[] = [];
    const levels: (keyof TopicEntry)[] = [
      'remembering',
      'understanding',
      'applying',
      'analyzing',
      'evaluating',
      'creating'
    ];

    const questions: any[] = [];
    let rowCorrect = 0;
    const rowTotal = row.expectedItems ?? 0;
    const startQ = itemCounter;
    const endQ = startQ + rowTotal - 1;

    // Build cognitive ranges
    let cognitiveStart = startQ;
    const levelRanges: { level: string; start: number; end: number }[] = [];
    for (const lvl of levels) {
      const count = Number(row[lvl]) || 0;
      if (count > 0) {
        const lvlStart = cognitiveStart;
        const lvlEnd = lvlStart + count - 1;
        levelRanges.push({ level: String(lvl), start: lvlStart, end: lvlEnd });

        cognitiveLevels.push({
          level: String(lvl),
          count,
          range: `${lvlStart}-${lvlEnd}`
        });

        cognitiveStart += count;
      }
    }

    // Push all questions in this TOS row
    for (let q = startQ; q <= endQ; q++) {
      const ans = this.result?.answers.find(a => a.question === q);

      // figure out which level this question belongs to
      let level = 'N/A';
      for (const range of levelRanges) {
        if (q >= range.start && q <= range.end) {
          level = range.level;
          break;
        }
      }

      if (ans) ans.level = level; // ✅ attach cognitive level to main answers array

      questions.push({
        question: q,
        marked: ans?.marked ?? null,
        correctAnswer: ans?.correctAnswer ?? null,
        correct: ans?.correct ?? false,
        topic: row.topicName,
        competency: row.learningCompetency,
        level
      });

      if (ans?.correct) rowCorrect++;
    }

    itemCounter += rowTotal;

    const performance = rowTotal > 0 ? (rowCorrect / rowTotal) * 100 : 0;

    rows.push({
      topic: row.topicName,
      competency: row.learningCompetency,
      percent: row.percent,
      expectedItems: row.expectedItems,
      cognitives: cognitiveLevels,
      questions,
      rowCorrect,
      rowTotal,
      performance: performance.toFixed(1) + '%'
    });
  }

  return rows;
}

private renderAnswerDistributionChart(answers: any[]) {
  this.answersChartRef.nativeElement.getContext("2d") as CanvasRenderingContext2D;

  console.log("📊 [Answer Distribution] Raw answers:", answers);

  // Counters for each option
  const counts: Record<'A' | 'B' | 'C' | 'D', number> = { A: 0, B: 0, C: 0, D: 0 };

  // Loop through answers and count
for (const ans of answers) {
  if (ans?.marked) {
    const mark = ans.marked.toString().toUpperCase().trim();
    if (['A', 'B', 'C', 'D'].includes(mark)) {
      counts[mark as 'A' | 'B' | 'C' | 'D']++;
    }
  }
}


  console.log("📊 [Answer Distribution] Counts:", counts);

  const ctx = this.answersChartRef.nativeElement.getContext("2d");

  // Destroy old chart if exists
  if (this.charts['answers']) {
    this.charts['answers'].destroy();
  }

  this.charts['answers'] = new Chart(ctx as unknown as ChartItem, {
    type: "bar",
    data: {
      labels: ["A", "B", "C", "D"],
      datasets: [
        {
          label: "Answer Choices",
          data: [counts.A, counts.B, counts.C, counts.D],
          backgroundColor: ["#42A5F5", "#66BB6A", "#FFA726", "#EF5350"],
        },
      ],
    },
  });

  console.log("✅ [Answer Distribution] Chart created.");
}

  // ✅ Chart for Bloom’s levels
  renderCognitiveChart(answers: AnswerEntry[]) {
    const ctx =  this.cognitiveChartRef?.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.cognitiveChart) this.cognitiveChart.destroy();

    const breakdown: { [level: string]: { correct: number; total: number } } = {};

    answers.forEach(a => {
      const level = a.level || 'N/A';
      if (!breakdown[level]) breakdown[level] = { correct: 0, total: 0 };
      breakdown[level].total++;
      if (a.correct) breakdown[level].correct++;
    });

    const labels = Object.keys(breakdown);
    const correct = labels.map(l => breakdown[l].correct);
    const total = labels.map(l => breakdown[l].total);

    this.cognitiveChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Correct', data: correct, backgroundColor: 'rgba(75, 192, 192, 0.7)' },
          { label: 'Total', data: total, backgroundColor: 'rgba(255, 99, 132, 0.3)' },
        ],
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: "Bloom's Cognitive Breakdown" } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  // ✅ Chart for Topic Breakdown
  renderTopicChart(answers: AnswerEntry[]) {
    const ctx =  this.topicChartRef?.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.topicChart) this.topicChart.destroy();

    const breakdown: { [topic: string]: { correct: number; total: number } } = {};

    answers.forEach(a => {
      const topic = a.topic || 'N/A';
      if (!breakdown[topic]) breakdown[topic] = { correct: 0, total: 0 };
      breakdown[topic].total++;
      if (a.correct) breakdown[topic].correct++;
    });

    const labels = Object.keys(breakdown);
    const correct = labels.map(l => breakdown[l].correct);
    const total = labels.map(l => breakdown[l].total);

    this.topicChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Correct', data: correct, backgroundColor: 'rgba(153, 102, 255, 0.7)' },
          { label: 'Total', data: total, backgroundColor: 'rgba(255, 206, 86, 0.3)' },
        ],
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: 'Topic Breakdown' } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  // ✅ Chart for Competency Breakdown
  renderCompetencyChart(answers: AnswerEntry[]) {
    const ctx =  this.competencyChartRef?.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.competencyChart) this.competencyChart.destroy();

    const breakdown: { [competency: string]: { correct: number; total: number } } = {};

    answers.forEach(a => {
      const competency = a.competency || 'N/A';
      if (!breakdown[competency]) breakdown[competency] = { correct: 0, total: 0 };
      breakdown[competency].total++;
      if (a.correct) breakdown[competency].correct++;
    });

    const labels = Object.keys(breakdown);
    const correct = labels.map(l => breakdown[l].correct);
    const total = labels.map(l => breakdown[l].total);

    this.competencyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Correct', data: correct, backgroundColor: 'rgba(255, 159, 64, 0.7)' },
          { label: 'Total', data: total, backgroundColor: 'rgba(54, 162, 235, 0.3)' },
        ],
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: 'Competency Breakdown' } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  printPage() {
    window.print();
  }
}