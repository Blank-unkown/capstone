import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { QuestionBankService } from '../../services/question-bank.service';
import { HttpClient } from '@angular/common/http';

/* ---------- TYPES ---------- */

export type CognitiveLevel =
  | 'remembering'
  | 'understanding'
  | 'applying'
  | 'analyzing'
  | 'evaluating'
  | 'creating';

export type ChoiceKey = 'A' | 'B' | 'C' | 'D';
export interface BankQuestion {
  id: string;

  classId: number;
  subjectId: number;

  tosId: number;
  tosKey: string;
  topicName: string;
  learningCompetency: string;

  cognitives?: { key: CognitiveLevel; value: number }[];
  mainCognitive?: CognitiveLevel;

  questionText: string;

  choices: {
    A: string;
    B: string;
    C: string;
    D: string;
  };

  correctAnswer: 'A' | 'B' | 'C' | 'D';
}
/*
export interface BankQuestion {

  id: string;

  classId: number;
  subjectId: number;
  mainCognitive?: CognitiveLevel; // <--- add this
  tosId: number; // LINK TO TOS ROW
  tosKey: string; // ✅ stable link to TOS row
  topicName: string;
  learningCompetency: string;

  cognitiveLevel:
    | 'remembering'
    | 'understanding'
    | 'applying'
    | 'analyzing'
    | 'evaluating'
    | 'creating';

  questionText: string;

  choices: {
    A: string;
    B: string;
    C: string;
    D: string;
  };

  correctAnswer: 'A' | 'B' | 'C' | 'D';
}
*/

@Component({
  selector: 'app-question-bank',
  templateUrl: './question-bank.page.html',
  styleUrls: ['./question-bank.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class QuestionBankPage implements OnInit {

//availableCognitives: { key: CognitiveLevel; value: number }[] = [];
selectedRowExpected = 0;
selectedRowCount = 0;

tos: any[] = [];

  classId!: number;
  subjectId!: number;

  questions: BankQuestion[] = [];

  // typed choice keys for template
  choiceKeys: ChoiceKey[] = ['A', 'B', 'C', 'D'];

  form!: BankQuestion;
  editingIndex: number | null = null;

  cognitiveLevels = [
    'remembering',
    'understanding',
    'applying',
    'analyzing',
    'evaluating',
    'creating'
  ];

  constructor(
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private questionBankService: QuestionBankService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.classId = Number(this.route.snapshot.paramMap.get('classId'));
    this.subjectId = Number(this.route.snapshot.paramMap.get('subjectId'));

    this.form = this.emptyQuestion();
    this.loadQuestions();

    this.loadTOS();

  }
loadTOS() {

  this.http.get<any[]>(
    `https://capstone-wwbm.onrender.com/subjects/${this.classId}/${this.subjectId}/tos`
  ).subscribe({

    next: data => {
      this.tos = data || [];
      console.log('TOS LOADED:', this.tos);
    },

    error: err => {
      console.error('TOS ERROR:', err);
      this.tos = [];
    }

  });

}
updateRowStats(tosId: number) {
  const row = this.tos.find(t => t.id === tosId);
  if (!row) return;

  this.selectedRowExpected = Number(row.expectedItems || 0);

  this.selectedRowCount = this.questions.filter(
    q => q.tosId === tosId
  ).length;

  const cognitives: { key: CognitiveLevel; value: number }[] = [
    { key: 'remembering', value: Number(row.remembering) },
    { key: 'understanding', value: Number(row.understanding) },
    { key: 'applying', value: Number(row.applying) },
    { key: 'analyzing', value: Number(row.analyzing) },
    { key: 'evaluating', value: Number(row.evaluating) },
    { key: 'creating', value: Number(row.creating) }
  ];

  // ✅ only those with value
  this.availableCognitives = cognitives.filter(c => c.value > 0);
}
  /* ---------- STORAGE ---------- */

  get storageKey(): string {
    return `question-bank-${this.classId}-${this.subjectId}`;
  }

  loadQuestions() {
    const raw = localStorage.getItem(this.storageKey);
    this.questions = raw ? JSON.parse(raw) : [];
  }

  saveQuestions() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.questions));
  }

  /* ---------- FORM ---------- */
emptyQuestion(): BankQuestion {

  return {

    id: '',

    classId: this.classId,
    subjectId: this.subjectId,

    tosId: 0,
    tosKey: '', // ✅ ADD
    topicName: '',
    learningCompetency: '',

    cognitives: [],
    mainCognitive: undefined,

    questionText: '',

    choices: {
      A: '',
      B: '',
      C: '',
      D: ''
    },

    correctAnswer: 'A'

  };

}
updateMainCognitive(q: any) {
  // UI-only update for now
  console.log('Main cognitive set:', q.mainCognitive);
}
availableCognitives: { key: CognitiveLevel; value: number }[] = [];
onTosChange() {
  const row = this.tos.find(t => t.id === this.form.tosId);
  if (!row) return;

  this.form.topicName = row.topicName;
  this.form.learningCompetency = row.learningCompetency;

  this.form.tosKey =
    `${row.classId}-${row.subjectId}-${row.topicName}-${row.learningCompetency}`;

  const cognitives: { key: CognitiveLevel; value: number }[] = [
    { key: 'remembering', value: Number(row.remembering) },
    { key: 'understanding', value: Number(row.understanding) },
    { key: 'applying', value: Number(row.applying) },
    { key: 'analyzing', value: Number(row.analyzing) },
    { key: 'evaluating', value: Number(row.evaluating) },
    { key: 'creating', value: Number(row.creating) }
  ];

  // ✅ filter ONLY those with value
  this.availableCognitives = cognitives.filter(c => c.value > 0);

  // ✅ save ALL cognitives into the question
  this.form.cognitives = this.availableCognitives;

  // reset optional main cognitive
  this.form.mainCognitive = undefined;

  this.updateRowStats(row.id);
}
  resetForm() {
    this.form = this.emptyQuestion();
    this.editingIndex = null;
  }
submitQuestion() {
    const row = this.tos.find(t => t.id === this.form.tosId);
  if (!row) {
    this.showAlert('Error', 'Invalid TOS row.');
    return;
  }

  const currentCount = this.questions.filter(
    q => q.tosId === row.id
  ).length;

  if (currentCount >= row.expectedItems && this.editingIndex === null) {
    this.showAlert(
      'Limit reached',
      `This TOS row already has ${row.expectedItems} questions.`
    );
    return;
  }
  if (!this.form.tosKey) {
    this.showAlert('Error', 'Invalid TOS link. Please reselect TOS row.');
    return;
  }

  if (!this.form.tosId) {
    this.showAlert('Error', 'Please select a TOS row.');
    return;
  }

  if (!this.form.questionText.trim()) {
    this.showAlert('Error', 'Question text is required.');
    return;
  }

  if (this.editingIndex !== null) {
    this.questions[this.editingIndex] = { ...this.form };
  } else {
    this.form.id = crypto.randomUUID();
    this.questions.push({ ...this.form });
  }
  this.updateRowStats(this.form.tosId);
  this.saveQuestions();
  this.resetForm();
}

  editQuestion(q: BankQuestion, index: number) {
    this.form = structuredClone(q);
    this.editingIndex = index;
  }

  deleteQuestion(index: number) {
    const tosId = this.questions[index].tosId;
    this.questions.splice(index, 1);
    this.saveQuestions();
    this.updateRowStats(tosId);
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }generateSampleQuestions(countPerLevel = 10) {

  if (!this.tos.length) {
    this.showAlert('Error', 'No TOS rows found.');
    return;
  }

  const cognitiveLevels: CognitiveLevel[] = [
    'remembering',
    'understanding',
    'applying',
    'analyzing',
    'evaluating',
    'creating'
  ];

  const questions: BankQuestion[] = [];

  for (const row of this.tos) {
    for (const level of cognitiveLevels) {
      for (let i = 1; i <= countPerLevel; i++) {

        questions.push({
          id: crypto.randomUUID(),

          classId: this.classId,
          subjectId: this.subjectId,

          tosId: row.id,
          tosKey: `${row.classId}-${row.subjectId}-${row.topicName}-${row.learningCompetency}`,

          topicName: row.topicName,
          learningCompetency: row.learningCompetency,

          mainCognitive: level, // ✅ FIX

          questionText: `(${level}) Sample Question ${i} (${row.topicName})`,

          choices: {
            A: `${i}`,
            B: `${i + 1}`,
            C: `${i + 2}`,
            D: `${i + 3}`
          },

          correctAnswer: 'B'
        });

      }
    }
  }

  this.questions.push(...questions);
  this.saveQuestions();

  this.showAlert(
    'Sample Questions Added',
    `${questions.length} questions added.`
  );
}generateSampleForCurrentTOS() {

  if (!this.form.tosId) {
    this.showAlert('Error', 'Please select a TOS row first.');
    return;
  }

  const row = this.tos.find(t => t.id === this.form.tosId);
  if (!row) {
    this.showAlert('Error', 'TOS row not found.');
    return;
  }

  const levels: CognitiveLevel[] = [
    'remembering',
    'applying',
    'analyzing',
    'evaluating',
    'creating'
  ];

  const questions: BankQuestion[] = [];

  for (const level of levels) {
    for (let i = 1; i <= 10; i++) {

      questions.push({
        id: crypto.randomUUID(),

        classId: this.classId,
        subjectId: this.subjectId,

        tosId: row.id,
        tosKey: `${row.classId}-${row.subjectId}-${row.topicName}-${row.learningCompetency}`,

        topicName: row.topicName,
        learningCompetency: row.learningCompetency,

        mainCognitive: level, // ✅ FIX

        questionText: `(${level}) Solve for x: x + ${i} = ${i + 5}`,

        choices: {
          A: `${i}`,
          B: `${i + 5}`,
          C: `${i + 10}`,
          D: `${i - 5}`
        },

        correctAnswer: 'B'
      });

    }
  }

  this.questions.push(...questions);
  this.saveQuestions();

  this.showAlert(
    'Sample Questions Added',
    `${questions.length} questions added for ${row.topicName}.`
  );
}
repairQuestions() {
  const updated = this.tos.reduce((acc, row) => {
    const key = `${row.classId}-${row.subjectId}-${row.topicName}-${row.learningCompetency}`;
    const matched = this.questions.filter(q => q.tosId === row.id);
    matched.forEach(q => q.tosKey = key);
    return acc;
  }, {});
  this.saveQuestions();
  this.showAlert('Success', 'Question links repaired!');
}
}
