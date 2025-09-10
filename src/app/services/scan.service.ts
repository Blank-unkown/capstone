import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScanService {
  private baseUrl = "http://localhost:3000/subjects"; // matches scansRouter mount

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
}
