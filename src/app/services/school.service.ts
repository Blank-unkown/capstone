import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ✅ Interfaces
export interface SchoolClass {
  id: number;
  name: string;
  user_id?: number;  // ✅ optional
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
  private apiUrl = 'https://capstone-wwbm.onrender.com'; // Adjust if needed

  constructor(private http: HttpClient) {}

  // ================== CLASSES ==================
  getClasses(userId: number): Observable<SchoolClass[]> {
    return this.http.get<SchoolClass[]>(`${this.apiUrl}/classes?user_id=${userId}`);
  }

  getClassById(id: number, userId: number): Observable<SchoolClass> {
  return this.http.get<SchoolClass>(`${this.apiUrl}/classes/${id}?user_id=${userId}`);
}

  addClass(name: string, userId: number): Observable<SchoolClass> {
    return this.http.post<SchoolClass>(`${this.apiUrl}/classes`, { name, user_id: userId });
  }

// NEW (accepts userId)
  updateClass(id: number, name: string, userId: number): Observable<SchoolClass> {
    return this.http.put<SchoolClass>(`${this.apiUrl}/classes/${id}`, { name, user_id: userId });
  }

  deleteClass(id: number, userId: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/classes/${id}?user_id=${userId}`);
}


  // ================== SUBJECTS ==================
  // NEW (accepts userId)
  getSubjectsByClass(classId: number, userId: number): Observable<SchoolSubject[]> {
    return this.http.get<SchoolSubject[]>(`${this.apiUrl}/subjects/class/${classId}?user_id=${userId}`);
  }


  getSubjectById(classId: number, subjectId: number): Observable<SchoolSubject> {
    return this.http.get<SchoolSubject>(`${this.apiUrl}/subjects/${classId}/${subjectId}`);
  }

  // NEW (accepts userId)
    addSubject(classId: number, name: string, userId: number): Observable<SchoolSubject> {
      return this.http.post<SchoolSubject>(`${this.apiUrl}/subjects`, { name, class_id: classId, user_id: userId });
    }

  // NEW (accepts userId)
    updateSubject(id: number, name: string, classId: number, userId: number): Observable<SchoolSubject> {
      return this.http.put<SchoolSubject>(`${this.apiUrl}/subjects/${id}`, { name, class_id: classId, user_id: userId });
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