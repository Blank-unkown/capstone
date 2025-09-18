import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ScanService {
  private baseUrl = 'https://capstone-wwbm.onrender.com/subjects'; // matches scansRouter mount

  constructor(private http: HttpClient) {}

  // ✅ Get all scans for a subject/class
  getScans(classId: number, subjectId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${classId}/${subjectId}/scans`);
  }

  // ✅ Get details of a specific scan (with answers)
  getScan(classId: number, subjectId: number, scanId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${classId}/${subjectId}/scans/${scanId}`);
  }

  // ✅ Create a new scan
  createScan(classId: number, subjectId: number, scanData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/${classId}/${subjectId}/scans`, scanData);
  }

  // (Optional) Delete a scan — if you decide to add this route later
  deleteScan(classId: number, subjectId: number, scanId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${classId}/${subjectId}/scans/${scanId}`);
  }

    // ✅ For scan.page.ts (transformed into a map for quick lookup)
  getAnswerKeyMap(subjectId: number): Observable<Record<number, 'A'|'B'|'C'|'D'>> {
    return this.http.get<any[]>(`${this.baseUrl}/subjects/${subjectId}/answer-key`).pipe(
      map(rawKey => {
        const mapped: Record<number, 'A'|'B'|'C'|'D'> = {};
        rawKey.forEach(q => {
          mapped[q.question_number] = q.correct_answer as 'A'|'B'|'C'|'D';
        });
        return mapped;
      })
    );
  }
    // ✅ For resultViewer.page.ts (raw array of objects)
  getAnswerKeyList(subjectId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/subjects/${subjectId}/answer-key`);
  }

}
