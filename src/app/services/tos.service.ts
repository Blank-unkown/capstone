import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';   // ✅ import map
import { TopicEntry } from '../services/local-data.service';

@Injectable({ providedIn: 'root' })
export class TosService {
  private baseUrl = 'https://capstone-wwbm.onrender.com/subjects';

  constructor(private http: HttpClient) {}

  // ✅ Fetch TOS for a subject in a class (map snake_case → camelCase)
  getTOS(classId: number, subjectId: number): Observable<TopicEntry[]> {
    return this.http
      .get<any[]>(`${this.baseUrl}/${classId}/${subjectId}/tos`)
      .pipe(
        map(rows =>
          rows.map(r => ({
            id: r.id,
            classId: r.classId ?? r.class_id,
            subjectId: r.subjectId ?? r.subject_id,
            topicName: r.topicName ?? r.topic_name,
            learningCompetency: r.learningCompetency ?? r.learning_competency,
            days: r.days,
            percent: r.percent,
            expectedItems: r.expectedItems ?? r.expected_items,
            remembering: r.remembering,
            understanding: r.understanding,
            applying: r.applying,
            analyzing: r.analyzing,
            evaluating: r.evaluating,
            creating: r.creating,
          }))
        )
      );
  }

  // ✅ Save TOS entries
  saveTOS(classId: number, subjectId: number, tos: TopicEntry[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/${classId}/${subjectId}/tos`, tos);
  }

  // ✅ Update existing TOS entries
  updateTOS(classId: number, subjectId: number, tos: TopicEntry[]): Observable<any> {
    return this.http.put(`${this.baseUrl}/${classId}/${subjectId}/tos`, tos);
  }

  // ✅ Delete one TOS entry
  deleteTOS(classId: number, subjectId: number, id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${classId}/${subjectId}/tos/${id}`);
  }
}
