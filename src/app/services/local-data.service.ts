import { Preferences } from '@capacitor/preferences';

export interface TopicEntry {
  topicName: string;
  learningCompetency: string;
  days: number;
  percent: number;
  expectedItems?: number;
  remembering?: number;
  understanding?: number;
  applying?: number;
  analyzing?: number;
  evaluating?: number;
  creating?: number;
}

export interface ScannedResult {
  id: number;
  croppedHeader: string;
  fullImage: string;
  answers: string[];
  score: number;
  total: number;
  date: string;
}

export interface Subject {
  id: number;
  name: string;
  tos: TopicEntry[];
  questions?: any[];
  answerKey?: string[];
  results?: ScannedResult[];
}

export interface Class {
  id: number;
  name: string;
  subjects: Subject[];
}

export class LocalDataService {
  private static classes: Class[] = [];

  // Load from storage into memory
  static async load(): Promise<void> {
    const stored = await Preferences.get({ key: 'examData' });
    if (stored.value) {
      this.classes = JSON.parse(stored.value);
    } else {
      this.classes = [];
    }
  }

  static async save(): Promise<void> {
    await Preferences.set({ key: 'examData', value: JSON.stringify(this.classes) });
  }

  static getClasses(): Class[] {
    return this.classes;
  }

  static addClass(name: string) {
    const newClass: Class = {
      id: Date.now(),
      name,
      subjects: []
    };
    this.classes.push(newClass);
  }

  static getClass(id: number): Class | undefined {
    return this.classes.find(cls => cls.id === id);
  }

  static addSubject(classId: number, subjectName: string) {
    const cls = this.getClass(classId);
    if (cls) {
      const newSubject: Subject = {
        id: Date.now(),
        name: subjectName,
        tos: [],
        questions: [],
        answerKey: []
      };
      cls.subjects.push(newSubject);
    }
  }

  static getSubject(classId: number, subjectId: number): Subject | undefined {
    return this.getClass(classId)?.subjects.find(sub => sub.id === subjectId);
  }

  static saveTOS(classId: number, subjectId: number, tos: TopicEntry[]) {
    const subject = this.getSubject(classId, subjectId);
    if (subject) subject.tos = tos;
  }

  static generateTOSMap(tos: TopicEntry[]): {
    question: number;
    topic: string;
    competency: string;
    level: string;
  }[] {
    const cognitiveLevels = ['remembering', 'understanding', 'applying', 'analyzing', 'evaluating', 'creating'];
    const map: any[] = [];
    let qNum = 1;

    tos.forEach(topic => {
      cognitiveLevels.forEach(level => {
        const count = Number(topic[level as keyof TopicEntry] || 0);
        for (let i = 0; i < count; i++) {
          map.push({
            question: qNum++,
            topic: topic.topicName,
            competency: topic.learningCompetency,
            level
          });
        }
      });
    });

    return map;
  }

  static saveScannedResult(classId: number, subjectId: number, result: ScannedResult) {
    const subject = this.getSubject(classId, subjectId);
    if (!subject) return;
    subject.results = subject.results || [];
    subject.results.push(result);
    this.save(); // still async-compatible
  }
}
