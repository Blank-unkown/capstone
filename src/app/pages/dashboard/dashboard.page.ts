
import { NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class DashboardPage {
  userName: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private navCtrl: NavController,
  ) {}

  ngOnInit() {
    const user = this.authService.getUserData().username;
    this.userName = user ? user.name : 'Teacher';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  goToClasses() {
    this.navCtrl.navigateForward('/class-list');
  }
}
