import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ✅ Interfaces
export interface SchoolClass {
  id: number;
  name: string;
}

export interface SchoolSubject {
  id: number;
  name: string;
  class_id: number;
}


export interface Scan {
  id: number;
  class_id: number;
  subject_id: number;
  score: number;
  total: number;
  answers: any[];  // array of { question, selected, correct }
  created_at: string;
}

export interface AnswerKey {
  id: number;
  subject_id: number;
  key: any[]; // array of { question, correctAnswer }
}

export interface TosEntry {
  id: number;
  subject_id: number;
  question: number;
  topic: string;
  competency: string;
  cognitive: string;
}

@Injectable({
  providedIn: 'root'
})
export class SchoolService {
  private apiUrl = 'http://localhost:3000'; // Adjust if needed

  constructor(private http: HttpClient) {}

  // ================== CLASSES ==================
  getClasses(): Observable<SchoolClass[]> {
    return this.http.get<SchoolClass[]>(`${this.apiUrl}/classes`);
  }

  getClassById(id: number): Observable<SchoolClass> {
    return this.http.get<SchoolClass>(`${this.apiUrl}/classes/${id}`);
  }

  addClass(name: string): Observable<SchoolClass> {
    return this.http.post<SchoolClass>(`${this.apiUrl}/classes`, { name });
  }

  updateClass(id: number, name: string): Observable<SchoolClass> {
    return this.http.put<SchoolClass>(`${this.apiUrl}/classes/${id}`, { name });
  }

  deleteClass(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/classes/${id}`);
  }

  // ================== SUBJECTS ==================
  getSubjectsByClass(classId: number): Observable<SchoolSubject[]> {
    return this.http.get<SchoolSubject[]>(`${this.apiUrl}/subjects/class/${classId}`);
  }

  getSubjectById(classId: number, subjectId: number): Observable<SchoolSubject> {
    return this.http.get<SchoolSubject>(`${this.apiUrl}/subjects/${classId}/${subjectId}`);
  }

  addSubject(classId: number, name: string): Observable<SchoolSubject> {
    return this.http.post<SchoolSubject>(`${this.apiUrl}/subjects`, { name, class_id: classId });
  }

  updateSubject(id: number, name: string, classId: number): Observable<SchoolSubject> {
    return this.http.put<SchoolSubject>(`${this.apiUrl}/subjects/${id}`, { name, class_id: classId });
  }

  deleteSubject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/subjects/${id}`);
  }
  // ================== SUBJECT RESULTS (Analysis) ==================
    getSubjectResults(classId: number, subjectId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/subjectResults/${classId}/${subjectId}/results`);
    }
    // ================== SCANS ==================
  getScans(classId: number, subjectId: number): Observable<Scan[]> {
    return this.http.get<Scan[]>(`${this.apiUrl}/subjects/${classId}/${subjectId}/scans`);
  }
  getScanById(scanId: number): Observable<Scan> {
    return this.http.get<Scan>(`${this.apiUrl}/scans/${scanId}`);
  }

  // ================== ANSWER KEYS ==================
  getAnswerKey(subjectId: number): Observable<AnswerKey> {
    return this.http.get<AnswerKey>(`${this.apiUrl}/subjects/${subjectId}/answer-key`);
  }

  // ================== TOS ==================
  getTos(subjectId: number): Observable<TosEntry[]> {
    return this.http.get<TosEntry[]>(`${this.apiUrl}/subjects/${subjectId}/tos`);
  }
}