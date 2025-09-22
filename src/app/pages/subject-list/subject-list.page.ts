import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { SchoolService } from '../../services/school.service';
import { TosService } from '../../services/tos.service';
import { ScanService } from '../../services/scan.service';
import { AnswerKeyService } from '../../services/answer-key.service';
import { TopicEntry } from 'src/app/services/local-data.service';
import { AuthService } from '../../services/auth.service';
import { Chart, registerables,ChartConfiguration, ChartItem} from 'chart.js';
Chart.register(...registerables);
//import Chart from 'chart.js/auto';

interface ScanAnswer {
  question: number;
  selected: string;
  correct: boolean;
}

interface ScannedResult {
  id: number;
  classID: number;
  subjectId: number;
  score: number;
  total: number;
  answers: ScanAnswer[];
   timestamp: string;            // ✅ Add this line
  headerImage?: string | null; // ✅ add this
  fullImage?: string | null;   // optional if you also display full scans
}

interface SchoolSubject {
  id: number;
  name: string;
  class_id: number;
}

@Component({
  selector: 'app-subject-list',
  templateUrl: './subject-list.page.html',
  styleUrls: ['./subject-list.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})

export class SubjectListPage implements OnInit {
  // At the top of your class
  
     private charts: { [key: string]: Chart } = {};
  @ViewChild('scoreChart', { static: false }) scoreChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('aggAnswersChart', { static: false }) aggAnswersChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('competencyChart', { static: false }) competencyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('aggCognitiveChart', { static: false }) aggCognitiveChartRef!: ElementRef<HTMLCanvasElement>;

  classId!: number;
  subjectId!: number;
  subjects: SchoolSubject[] = [];
  subjectName = '';

  tos: TopicEntry[] = [];
  answerKey: string[] = [];
  results: ScannedResult[] = [];

  meanPercentage = 0;
  scoreDistribution: { range: string; count: number }[] = [];
  competencyBreakdown: Record<string, { correct: number; total: number }> = {};
  showAnalysis = false;

  aggregatedAnswerDist: { A: number; B: number; C: number; D: number } = { A: 0, B: 0, C: 0, D: 0 };
  aggregatedCognitive: { [level: string]: { correct: number; total: number } } = {};

  private aggAnswersChart?: Chart;
  private aggCognitiveChart?: Chart;
  private scoreChart?: Chart;
  private competencyChart?: Chart;

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private router: Router,
    private schoolService: SchoolService,
    private tosService: TosService,
    private scanService: ScanService,
    private answerKeyService: AnswerKeyService,
    private authService: AuthService   // ✅ add this
  ) {}

  ngOnInit() {
  this.classId = Number(this.route.snapshot.paramMap.get('id'));
//this.subjectId = Number(this.route.snapshot.paramMap.get('subjectId')); // ✅ make sure this matches your routing

  this.loadSubjects();
}
loadSubjects() {
  const userId = this.authService.getCurrentUserId();   // ✅ add this
  this.schoolService.getSubjectsByClass(this.classId, userId).subscribe(subs => {
    console.log("📌 Subjects loaded:", subs);
    this.subjects = subs;
  });
}

addSubject() {
  if (this.subjectName.trim()) {
    const userId = this.authService.getCurrentUserId();   // ✅ add this
    this.schoolService.addSubject(this.classId, this.subjectName, userId).subscribe(newSubject => {
      this.subjects.push(newSubject);
      this.subjectName = '';
    });
  }
}

editSubject(id: number, oldName: string) {
  const newName = prompt('Enter new subject name:', oldName);
  if (newName && newName.trim()) {
    const userId = this.authService.getCurrentUserId();   // ✅ add this
    this.schoolService.updateSubject(id, newName, this.classId, userId).subscribe(() => {
      const subj = this.subjects.find(s => s.id === id);
      if (subj) subj.name = newName;
    });
  }
}


  // ✅ Delete subject (removes from MySQL)
  deleteSubject(subjectId: number) {
    if (confirm('Delete this subject?')) {
      this.schoolService.deleteSubject(subjectId).subscribe(() => {
        this.subjects = this.subjects.filter(s => s.id !== subjectId);
      });
    }
  }

  // ✅ Navigate to TOS page
  goToTOS(subjectId: number) {
    this.navCtrl.navigateForward(`/tos/${this.classId}/${subjectId}`);
  }
// Add these at the top of the class (properties)
rawScans: ScannedResult[] = [];             // raw scan objects from /scans endpoint — used for cards
analysisResults: ScannedResult[] = [];      // results from /results endpoint — used for analysis/charts

// -----------------------------
// Updated goToScannedResults (set rawScans and then load analysis)
goToScannedResults(subjectId: number) {
  this.subjectId = subjectId;
  console.log("📥 goToScannedResults() → Fetching scans for:", { classId: this.classId, subjectId: this.subjectId });

  this.scanService.getScans(this.classId, this.subjectId).subscribe({
    next: scans => {
      console.log("📥 Scans fetched:", scans);
      // keep raw scans separate
      this.rawScans = scans || [];
      this.showAnalysis = true;

      // chain TOS -> AnswerKey -> Analysis (now safe because subjectId is set)
      this.tosService.getTOS(this.classId, this.subjectId).subscribe({
        next: tos => {
          this.tos = tos;
          this.answerKeyService.getAnswerKey(this.classId, this.subjectId).subscribe({
            next: key => {
              this.answerKey = key;
              this.loadAnalysis(); // load analysis into analysisResults (won't overwrite rawScans)
            },
            error: err => {
              console.error("Failed to fetch Answer Key", err);
              this.answerKey = [];
              this.loadAnalysis();
            }
          });
        },
        error: err => {
          console.error("Failed to fetch TOS", err);
          this.tos = [];
          this.loadAnalysis();
        }
      });
    },
    error: err => {
      console.error("❌ Failed to load scans:", err);
      this.rawScans = [];
      this.showAnalysis = true;
    }
  });
}

  toggleAnalysis() {
    this.showAnalysis = !this.showAnalysis;
    if (this.showAnalysis) {
      this.loadAnalysis();
    }
  }
// -----------------------------
// deleteScan: remove from both arrays if present, then refresh analysis
deleteScan(resultId: number) {
  if (!confirm('Are you sure you want to delete this scanned result?')) return;

  fetch(`https://capstone-wwbm.onrender.com/scans/${resultId}`, { method: 'DELETE' })
    .then(res => {
      if (!res.ok) throw new Error('Failed to delete scan');

      // Remove locally from rawScans and analysisResults
      this.rawScans = this.rawScans.filter(r => r.id !== resultId);
      this.analysisResults = this.analysisResults.filter(r => r.id !== resultId);

      // Recompute distribution and charts
      this.computeDistribution();
      setTimeout(() => {
        this.renderScoreDistributionChart();
        this.renderAggregatedAnswerChart();
        this.renderAggregatedCognitiveChart();
        this.renderCompetencyChart();
      }, 0);

    })
    .catch(err => {
      console.error('Error deleting scan:', err);
      alert('Failed to delete scan');
    });
}
// 🔹 View a single scan
// 🔹 View a single scan
viewScan(scan: any) {
  console.log("🧭 Navigating with:", scan);

  this.router.navigate([
    "/resultviewer",
    scan.class_id,   // ✅ match backend response
    scan.subject_id, // ✅ match backend response
    scan.id          // ✅ scan id
  ]);
}


// 🔹 View scan by ID (if you only have ID)
viewResult(scanId: number, subjectId: number) {
  this.router.navigate([
    '/resultviewer',
    this.classId,
    subjectId,
    scanId
  ]);
}

// -----------------------------
// Guarded loadAnalysis that sets analysisResults (does NOT replace rawScans)
async loadAnalysis() {
  if (!this.classId || !this.subjectId) {
    console.warn("⚠️ Skipping loadAnalysis: classId or subjectId missing.");
    return;
  }

  const userId = this.authService.getCurrentUserId(); // ✅ get logged-in userId
  if (!userId) {
    console.error("❌ No userId found in authService");
    return;
  }

  try {
    const url = `https://capstone-wwbm.onrender.com/subjects/${this.classId}/${this.subjectId}/results?user_id=${userId}`;
    console.log("📡 Fetching analysis from:", url);

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    console.log("📊 Raw backend response:", data);

    // ✅ Save analysis results
    this.analysisResults = data.results || [];
    this.meanPercentage = data.meanPercentage || 0;
    this.aggregatedAnswerDist = data.answerDist || { A: 0, B: 0, C: 0, D: 0 };
    this.aggregatedCognitive = data.cognitive || {};

    if (this.tos?.length && this.analysisResults.length) {
      this.computeCompetencyBreakdown();
    }

    this.computeDistribution();

    setTimeout(() => {
      this.renderAggregatedAnswerChart();
      this.renderAggregatedCognitiveChart();
      this.renderScoreDistributionChart();
      this.renderCompetencyChart();
    }, 0);

  } catch (err) {
    console.error("❌ Failed to load subject results", err);
  }
}

// -----------------------------
// computeDistribution uses rawScans (fallback to analysisResults if rawScans empty)
computeDistribution() {
  const source = (this.rawScans && this.rawScans.length) ? this.rawScans : this.analysisResults;
  const ranges = [
    { range: '0-49', min: 0, max: 49 },
    { range: '50-69', min: 50, max: 69 },
    { range: '70-89', min: 70, max: 89 },
    { range: '90-100', min: 90, max: 100 },
  ];
  const counts = ranges.map(r => ({ range: r.range, count: 0 }));

  source.forEach(r => {
    const percent = (r.score / r.total) * 100;
    for (let i = 0; i < ranges.length; i++) {
      if (percent >= ranges[i].min && percent <= ranges[i].max) {
        counts[i].count++;
        break;
      }
    }
  });

  this.scoreDistribution = counts;
}

// -----------------------------
// computeCompetencyBreakdown should check analysisResults (it relies on r.answers)
computeCompetencyBreakdown() {
  this.competencyBreakdown = {};
  if (!this.tos || !this.tos.length) return;
  if (!this.analysisResults || !this.analysisResults.length) return;

  let questionIndex = 1;

  for (const entry of this.tos) {
    const key = `${entry.topicName} - ${entry.learningCompetency}`;
    if (!this.competencyBreakdown[key]) {
      this.competencyBreakdown[key] = { correct: 0, total: 0 };
    }

    const items = entry.expectedItems ?? 0;

    for (let i = 0; i < items; i++) {
      this.analysisResults.forEach(r => {
        const ans = r.answers.find(a => a.question === questionIndex);
        if (ans) {
          this.competencyBreakdown[key].total++;
          if (ans.correct) this.competencyBreakdown[key].correct++;
        }
      });
      questionIndex++;
    }
  }
}

renderAggregatedAnswerChart() {
  if (!this.aggregatedAnswerDist || !this.aggAnswersChartRef) return;
  const ctx = this.aggAnswersChartRef.nativeElement.getContext('2d');
  if (!ctx) return;
  if (this.aggAnswersChart) this.aggAnswersChart.destroy();

  this.aggAnswersChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C', 'D'],
      datasets: [
        {
          label: 'Total Selections',
          data: [
            this.aggregatedAnswerDist.A || 0,
            this.aggregatedAnswerDist.B || 0,
            this.aggregatedAnswerDist.C || 0,
            this.aggregatedAnswerDist.D || 0,
          ],
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: 'Aggregated Answer Distribution' } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

renderAggregatedCognitiveChart() {
  if (!this.aggregatedCognitive) return; // ✅ guard
 const ctx = this.aggCognitiveChartRef.nativeElement.getContext('2d');
  if (!ctx) return;
  if (this.aggCognitiveChart) this.aggCognitiveChart.destroy();

  const labels = Object.keys(this.aggregatedCognitive);
  const correct = labels.map(l => this.aggregatedCognitive[l]?.correct || 0);
  const total = labels.map(l => this.aggregatedCognitive[l]?.total || 0);

  this.aggCognitiveChart = new Chart(ctx, {
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
      plugins: { title: { display: true, text: "Aggregated Cognitive Breakdown" } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

renderScoreDistributionChart() {
  if (!this.scoreDistribution || !this.scoreDistribution.length) return; // ✅ guard
  const ctx = this.scoreChartRef.nativeElement.getContext('2d');
  if (!ctx) return;
  if (this.scoreChart) this.scoreChart.destroy();

  const labels = this.scoreDistribution.map(d => d.range);
  const data = this.scoreDistribution.map(d => d.count);

  this.scoreChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Number of Students',
          data,
          backgroundColor: 'rgba(153, 102, 255, 0.7)',
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: 'Score Distribution' } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
    },
  });
}

renderCompetencyChart() {
  if (!this.competencyBreakdown || !Object.keys(this.competencyBreakdown).length) return; // ✅ guard
 const ctx = this. competencyChartRef.nativeElement.getContext('2d');
  if (!ctx) return;
  if (this.competencyChart) this.competencyChart.destroy();

  const labels = Object.keys(this.competencyBreakdown);
  const correct = labels.map(l => this.competencyBreakdown[l].correct);
  const total = labels.map(l => this.competencyBreakdown[l].total);

  this.competencyChart = new Chart(ctx, {
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
      plugins: { 
        title: { display: true, text: 'Competency Breakdown' },
        legend: { position: 'top' },
      },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
    },
  });
}

}
