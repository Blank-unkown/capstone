import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
}
