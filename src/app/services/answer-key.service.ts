import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AnswerKeyService {
  private baseUrl = 'https://capstone-wwbm.onrender.com/subjects';

  constructor(private http: HttpClient) {}

  // Fetch Answer Key
  getAnswerKey(classId: number, subjectId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/${classId}/${subjectId}/answer-key`
    );
  }

  // Save Answer Key
  saveAnswerKey(
    classId: number,
    subjectId: number,
    answerKey: string[]
  ): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/${classId}/${subjectId}/answer-key`,
      answerKey
    );
  }

  getAnswerKeyList(classId: number, subjectId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${classId}/${subjectId}/answer-key`);
  }

  getAnswerKeyMap(classId: number, subjectId: number): Observable<Record<number, 'A'|'B'|'C'|'D'>> {
    return this.getAnswerKeyList(classId, subjectId).pipe(
      map((rawKey: any[]) => {
        const mapped: Record<number, 'A'|'B'|'C'|'D'> = {};
        rawKey.forEach(q => {
          mapped[q.question_number] = q.correct_answer as 'A'|'B'|'C'|'D';
        });
        return mapped;
      })
    );
  }
}
