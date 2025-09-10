import { Component } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LocalDataService } from '../../services/local-data.service';
import { SchoolService, SchoolClass } from '../../services/school.service';

@Component({
  selector: 'app-class-list',
  templateUrl: './class-list.page.html',
  styleUrls: ['./class-list.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class ClassListPage {
  className = '';
  //classes = LocalDataService.getClasses();
  classes: SchoolClass[] = [];

  constructor(
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private schoolService: SchoolService,
  ) {}

    ngOnInit() {
    this.loadClasses();
  }

     loadClasses() {
    this.schoolService.getClasses().subscribe(data => this.classes = data);
  }

  addClass() {
    if (this.className.trim()) {
      this.schoolService.addClass(this.className).subscribe(newClass => {
        this.classes.push(newClass);
        this.className = '';
      });
    }
  }



  goToSubjects(classId: number) {
  this.navCtrl.navigateForward(`/subject-list/${classId}`);
}

   editClass(cls: SchoolClass) {
    const newName = prompt('Enter new class name:', cls.name);
    if (newName) {
      this.schoolService.updateClass(cls.id, newName).subscribe(updated => {
        cls.name = updated.name;
      });
    }
  }
  
  
deleteClass(classId: number) {
  if (confirm('Delete this class?')) {
    this.schoolService.deleteClass(classId).subscribe(() => {
      this.classes = this.classes.filter(c => c.id !== classId);
    });
  }
}

  refreshClasses() {
    this.classes = LocalDataService.getClasses();
  }
}
