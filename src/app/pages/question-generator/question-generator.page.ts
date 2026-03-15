import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
// import { LocalDataService, TopicEntry } from '../../services/local-data.service';
import { TosService } from '../../services/tos.service';
import { SchoolService } from '../../services/school.service';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

interface TopicEntry {
  id: number; // REQUIRED
  topicName: string;
  learningCompetency: string;
  expectedItems: number;
  remembering: number;
  understanding: number;
  applying: number;
  analyzing: number;
  evaluating: number;
  creating: number;
}

interface BankQuestion {
  tosId: number;   // ✅ ADD THIS
  id: string;
  classId: number;
  subjectId: number;
  topicName: string;
  learningCompetency: string;
  cognitiveLevel: string;
  questionText: string;
  choices: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}
interface GeneratedExam {

  classId: number;
  subjectId: number;
  createdAt: number;

  questions: {
    examNo: number;
    bankQuestionId?: string;
    questionText: string;
    choices: {
      A: string;
      B: string;
      C: string;
      D: string;
    };
  }[];

  pages: any[][];

  // NEW — TOS row summaries (block info)
  rows: {
    topic: string;
    competency: string;

    start: number;
    end: number;

    remembering: number;
    understanding: number;
    applying: number;
    analyzing: number;
    evaluating: number;
    creating: number;

    expected: number;
    generated: number;
  }[];
}

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

  questions: any[] = []; // flat list (still kept)

  tos: TopicEntry[] = [];

  // IMPORTANT — initialize so template never crashes
  generatedExam: any = {
    className: '',
    subjectName: '',
    totalItems: 0,
    questions: [],
    pages: []
  };

  // NEW — pages for printing
  pages: any[][] = [];

  cognitiveOrder = [
    'remembering',
    'understanding',
    'applying',
    'analyzing',
    'evaluating',
    'creating'
  ];

  constructor(
    private http: HttpClient,
    private tosService: TosService,
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private schoolService: SchoolService,
    private authService: AuthService
  ) {}

  /* ================= QUESTION BANK ================= */

loadQuestionBank(): BankQuestion[] {
  const key = `question-bank-${this.classId}-${this.subjectId}`;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

  ngOnInit() {
    this.classId = Number(this.route.snapshot.paramMap.get('classId'));
    this.subjectId = Number(this.route.snapshot.paramMap.get('subjectId'));

    const userId = this.authService.getCurrentUserId();

    let classLoaded = false;
    let subjectLoaded = false;

    this.schoolService.getClassById(this.classId, userId).subscribe(cls => {
      this.className = cls?.name || '';
      classLoaded = true;
      if (classLoaded && subjectLoaded) this.loadTOS();
    });

    this.schoolService.getSubjectById(this.classId, this.subjectId).subscribe(sub => {
      this.subjectName = sub?.name || '';
      subjectLoaded = true;
      if (classLoaded && subjectLoaded) this.loadTOS();
    });

    // Only load if exists, otherwise generate
    const key = `generated-exam-${this.classId}-${this.subjectId}`;

    if (localStorage.getItem(key)) {
      // TEMP: disable cache
    localStorage.removeItem(
      `generated-exam-${this.classId}-${this.subjectId}`
    );

    // DO NOT load old exam
    // this.loadGeneratedExam();

    } else {
      this.loadTOS();
    }
  }

  loadTOS() {
    this.http.get<TopicEntry[]>(
      `https://capstone-wwbm.onrender.com/subjects/${this.classId}/${this.subjectId}/tos`
    ).subscribe({
      next: tos => {
        this.tos = Array.isArray(tos) ? tos : [];
        this.generateExam();
      },
      error: err => {
        console.error('TOS Load Error:', err);
        this.tos = [];
        localStorage.removeItem(
          `generated-exam-${this.classId}-${this.subjectId}`
        );

        this.generateExam();

      }
    });
  }
  loadGeneratedExam() {
  const raw = localStorage.getItem(
    `generated-exam-${this.classId}-${this.subjectId}`
  );

  if (raw) {
    this.generatedExam = JSON.parse(raw);
    this.pages = this.generatedExam.pages;
  }
}

generateExam() {

  const bank = this.loadQuestionBank();

  console.log('QUESTION BANK COUNT:', bank.length);

  const questions: any[] = [];
  let examNo = 1;

  // For preview (row summaries)
  const rowSummaries: any[] = [];

  for (const entry of this.tos) {

    const expected = Number(entry.expectedItems || 0);

    if (expected <= 0) continue;

    console.log('PROCESSING ROW:', entry);

    /* ============================
       GET ALL MATCHING QUESTIONS
    ============================ */

    const matches = bank.filter(q =>
  Number(q.tosId) === Number(entry.id)
);

    console.log('FOUND:', matches.length);

    if (matches.length === 0) continue;

    /* ============================
       PICK QUESTIONS
    ============================ */

    const selected: BankQuestion[] = [];
    let remaining = [...matches];


    const pick = (level: string, count: number) => {

      const pool = this.shuffle(
        remaining.filter(q =>
          q.cognitiveLevel?.toLowerCase().trim() === level
        )
      );

      const chosen = pool.slice(0, count);

      selected.push(...chosen);

      // REMOVE picked from remaining
      remaining = remaining.filter(q => !chosen.includes(q));
    };


    pick('remembering', entry.remembering || 0);
    pick('understanding', entry.understanding || 0);
    pick('applying', entry.applying || 0);
    pick('analyzing', entry.analyzing || 0);
    pick('evaluating', entry.evaluating || 0);
    pick('creating', entry.creating || 0);

    // FILL IF STILL NOT ENOUGH
    if (selected.length < expected) {

      const needed = expected - selected.length;

      const extra = this.shuffle(remaining).slice(0, needed);

      selected.push(...extra);

    }

    const startNo = examNo;

    for (const q of selected) {

      questions.push({
        examNo: examNo++,
        bankQuestionId: q.id,
        questionText: q.questionText.replace(/\(.*?\)/g, '').trim(),
        choices: { ...q.choices }
      });
    }

    const endNo = examNo - 1;

    /* ============================
       SAVE ROW INFO (FOR PREVIEW)
    ============================ */

    rowSummaries.push({
      topic: entry.topicName,
      competency: entry.learningCompetency,

      start: startNo,
      end: endNo,

      remembering: entry.remembering || 0,
      understanding: entry.understanding || 0,
      applying: entry.applying || 0,
      analyzing: entry.analyzing || 0,
      evaluating: entry.evaluating || 0,
      creating: entry.creating || 0,

      expected,
      generated: selected.length
    });

    /* ============================
       WARNING IF NOT ENOUGH
    ============================ */

    if (selected.length < expected) {

      this.showAlert(
        'Warning',
        `"${entry.topicName}" only generated ${selected.length} of ${expected} items.`
      );
    }
    // ✅ DEBUG LOG (ADD THIS)
    console.log(
      entry.topicName,
      'Expected:', expected,
      'Available:', matches.length,
      'Generated:', selected.length
    );
  }

  /* ============================
     SPLIT TO PAGES
  ============================ */

  this.pages = [];
  const pageSize = 25;

  for (let i = 0; i < questions.length; i += pageSize) {
    this.pages.push(questions.slice(i, i + pageSize));
  }

  const generatedExam: GeneratedExam = {
    classId: this.classId,
    subjectId: this.subjectId,
    createdAt: Date.now(),
    questions,
    pages: this.pages,
    rows: rowSummaries // IMPORTANT
  };

  /* ============================
     SAVE
  ============================ */

  localStorage.setItem(
    `generated-exam-${this.classId}-${this.subjectId}`,
    JSON.stringify(generatedExam)
  );
  this.questions = questions;
  this.generatedExam = generatedExam;
  this.pages = generatedExam.pages;


  if (questions.length === 0) {

    this.showAlert(
      'No Questions Found',
      'No matching questions in Question Bank.'
    );

  } else {

    this.showAlert(
      'Success',
      `${questions.length} questions generated (BLOCK MODE).`
    );
    
  }
  
}

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  printExam() {
    window.print();
  }
  viewMode: 'preview' | 'edit' | 'print' = 'preview';
  setMode(mode: 'preview' | 'edit' | 'print') {
    this.viewMode = mode;
  }

  nextPage() {
    // optional if you want manual navigation later
  }
/*
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
*/
}
