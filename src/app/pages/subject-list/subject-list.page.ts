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
  scannedResults: ScannedResult[] = [];

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
  const subject = LocalDataService.getSubject(this.classId, subjectId);
  if (!subject || !subject.results?.length) {
    alert('No scanned results found.');
    return;
  }
  this.scannedResults = subject.results;
  this.subjectId = subjectId; // ✅ Needed for HTML binding
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
