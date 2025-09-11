import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScanAnswerService {
  private baseUrl = "https://capstone-wwbm.onrender.com/scans"; // matches scanAnswersRouter mount

  constructor(private http: HttpClient) {}

  // ✅ Get all answers for a scan
  getAnswers(scanId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${scanId}/scan-answers`);
  }

  // ✅ Add/update answers for a scan
  saveAnswers(scanId: number, answers: any[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/${scanId}/scan-answers`, { answers });
  }

  // ✅ Get answers for a single student (if needed)
  getStudentAnswers(scanId: number, studentId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${scanId}/scan-answers/${studentId}`);
  }
}
