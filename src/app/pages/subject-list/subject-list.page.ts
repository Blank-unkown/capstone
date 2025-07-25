import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { LocalDataService, Subject, ScannedResult } from '../../services/local-data.service';

@Component({
  selector: 'app-subject-list',
  templateUrl: './subject-list.page.html',
  styleUrls: ['./subject-list.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class SubjectListPage implements OnInit {
  classId!: number;
  subjectId!: number;
  subjects: Subject[] = [];
  subjectName = '';
  scanResults: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private router: Router
  ) {}

  ngOnInit() {
    this.classId = Number(this.route.snapshot.paramMap.get('id'));
    const cls = LocalDataService.getClass(this.classId);
    this.subjects = cls?.subjects || [];
  }

  addSubject() {
    if (this.subjectName.trim()) {
      LocalDataService.addSubject(this.classId, this.subjectName);
      const cls = LocalDataService.getClass(this.classId);
      this.subjects = cls?.subjects || [];
      this.subjectName = '';
    }
  }

  goToTOS(subjectId: number) {
    this.navCtrl.navigateForward(`/tos/${this.classId}/${subjectId}`);
  }

goToScannedResults(subjectId: number) {
  this.scanResults = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('scan_')) {
      const data = JSON.parse(localStorage.getItem(key)!);

      // Filter by selected subject only
      if (data.subjectId === subjectId && data.classId === this.classId) {
        this.scanResults.push(data);
      }
    }
  }

  this.subjectId = subjectId;

  if (this.scanResults.length === 0) {
    alert('No scanned results found for this subject.');
  }
}


viewScan(scan: any) {
  this.router.navigate(['/resultviewer'], {
    state: { resultData: scan }
  });
}

  viewResult(resultId: number, subjectId: number) {
    this.router.navigate(['/resultviewer'], {
      queryParams: {
        classId: this.classId,
        subjectId: subjectId,
        resultId: resultId
      }
    });
  }
}
