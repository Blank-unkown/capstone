import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { SchoolService } from '../../services/school.service';
import { RouterModule } from '@angular/router';
import { AnswerSheetGeneratorPage } from '../answer-sheet-generator/answer-sheet-generator.page';
import { AuthService } from '../../services/auth.service';

export interface TopicEntry {
  id?: number;                // DB row id
  subjectId: number; 
  classId: number; 
  topicName: string;
  learningCompetency: string;
  days: number;
  percent: number;
  expectedItems: number;
  remembering: number;
  understanding: number;
  applying: number;
  analyzing: number;
  evaluating: number;
  creating: number;

  isNew?: boolean;   // new row
  isDirty?: boolean; // modified row
}

@Component({
  selector: 'app-tos',
  templateUrl: './tos.page.html',
  styleUrls: ['./tos.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule, AnswerSheetGeneratorPage]
})
export class TosPage implements OnInit {
  classId!: number;
  subjectId!: number;
  className = '';
  subjectName = '';
  tos: TopicEntry[] = [];
  viewMode: 'edit' | 'print' | 'answersheet' = 'edit';

  constructor(
    private route: ActivatedRoute,
    private schoolService: SchoolService,
    private http: HttpClient,
    private toastController: ToastController,
    private authService: AuthService,  // ✅ add this
  ) {}

  ngOnInit() {
  this.classId = Number(this.route.snapshot.paramMap.get('classId'));
  this.subjectId = Number(this.route.snapshot.paramMap.get('subjectId'));

  console.log('➡️ TosPage init with classId:', this.classId, 'subjectId:', this.subjectId);

  // Fetch class name
  const userId = this.authService.getCurrentUserId();
  this.schoolService.getClassById(this.classId, userId).subscribe(cls => {
    this.className = cls?.name || '';
  });

  // Fetch subject name
  this.schoolService.getSubjectById(this.classId, this.subjectId).subscribe(subject => {
    this.subjectName = subject?.name || '';
  });

  // Fetch TOS
  this.loadTOS();
}

loadTOS() {
  console.log("📡 Fetching TOS for subjectId=" + this.subjectId);

  this.http.get<TopicEntry[] | null>(
  `https://capstone-wwbm.onrender.com/subjects/${this.classId}/${this.subjectId}/tos`
)
    .subscribe(tos => {
      console.log("✅ Received TOS:", tos);

      if (Array.isArray(tos) && tos.length > 0) {
        this.tos = tos;
      } else {
        console.warn("⚠️ No TOS found, using defaults");
        this.tos = [this.createDefaultRow()];
      }
    }, err => {
      console.error("❌ Failed to fetch TOS:", err);
      this.tos = [this.createDefaultRow()];
    });
}

// Save a single topic
saveTopic(row: TopicEntry) {
  if (!row) return;
  const payload = { ...row };
  delete payload.isNew;
  delete payload.isDirty;

  if (row.id) {
    // Existing row → update
    this.http.put(
      `https://capstone-wwbm.onrender.com/subjects/${this.classId}/${this.subjectId}/tos`,
      [payload] // backend expects array
    ).subscribe({
      next: () => {
        row.isDirty = false;
        console.log('Topic updated', row);
      },
      error: err => {
        console.error('Failed to update topic:', err);
        alert('Failed to update topic.');
      }
    });
  } else {
    // New row → insert
    this.http.post(
      `https://capstone-wwbm.onrender.com/subjects/${this.classId}/${this.subjectId}/tos`,
      payload
    ).subscribe({
      next: () => {
        row.isNew = false;
        console.log('New topic saved', row);
      },
      error: err => {
        console.error('Failed to save topic:', err);
        alert('Failed to save topic.');
      }
    });
  }
}

// Save all new topics
saveAllNewTopics() {
  const unsaved = this.tos.filter(t => t.isNew);
  if (!unsaved.length) return;

  // Save all new topics
    this.http.post(
      `https://capstone-wwbm.onrender.com/subjects/${this.classId}/${this.subjectId}/tos`,
      unsaved.map(t => {
        const copy = { ...t };
        delete copy.id;
        delete copy.isNew;
        return copy;
      })

  ).subscribe({
    next: () => {
      unsaved.forEach(t => t.isNew = false);
      this.loadTOS();
      console.log('All new topics saved');
    },
    error: err => {
      console.error('Failed to save all new topics:', err);
      alert('Failed to save all new topics.');
    }
  });
}

// Save (update existing)
saveTOS() {
  this.saveAllNewTopics();

  const existing = this.tos.filter(t => !t.isNew);
  if (existing.length === 0) return;

  // Update existing topics
    this.http.put(
      `https://capstone-wwbm.onrender.com/subjects/${this.classId}/${this.subjectId}/tos`,
      existing
    )
    .subscribe({
      next: () => {
        alert('TOS saved successfully!');
        this.loadTOS();
      },
      error: err => {
        console.error('Failed to save TOS:', err);
        alert('Failed to save TOS. Check console.');
      }
    });
}

// Delete topic
deleteTopic(row: TopicEntry) {
  if (!row) return;

  if (row.isNew) {
    this.tos = this.tos.filter(r => r !== row);
    return;
  }

  // Delete topic
    this.http.delete(
      `https://capstone-wwbm.onrender.com/subjects/${this.classId}/${this.subjectId}/tos/${row.id}`
    )
    .subscribe({
      next: () => {
        this.tos = this.tos.filter(r => r !== row);
        console.log('Topic deleted', row);
      },
      error: err => {
        console.error('Failed to delete topic:', err);
        alert('Failed to delete topic. Check console.');
      }
    });
}

  private createDefaultRow(): TopicEntry {
    return {
      subjectId: this.subjectId,
      classId: this.classId,  // ✅ add this
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
      creating: 0,
      isNew: true
    };
  }

  getTotal(field: keyof TopicEntry): number {
    if (!this.tos || !Array.isArray(this.tos)) return 0;
    return this.tos.reduce((sum, row) => {
      if (!row || row[field] == null) return sum;
      return sum + Number(row[field] || 0);
    }, 0);
  }

  addTopicRow() {
    if (!this.tos) this.tos = [];
    const newRow: TopicEntry = this.createDefaultRow();
    this.tos.push(newRow);
  }

  setMode(mode: 'edit' | 'print' | 'answersheet') {
    this.viewMode = mode;
    if (mode === 'print') {
      setTimeout(() => window.print(), 300);
    }
  }
    get hasNewTopics(): boolean {
    return Array.isArray(this.tos) && this.tos.some(t => t.isNew);
  }
  markDirty(row: TopicEntry) {
  if (!row.isNew) {
    row.isDirty = true;
  }
}
}