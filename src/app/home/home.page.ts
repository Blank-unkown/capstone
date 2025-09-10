import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';   // ✅ fixed import

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class HomePage implements OnInit {
  loginEmail = '';
  loginPassword = '';
  registerEmail = '';
  registerPassword = '';
  registerName = '';
  isRegistering = false;

  // ✅ Add BASE_URL
  BASE_URL = 'http://localhost:3000/auth'; // adjust to match your Node server

  constructor(
    private http: HttpClient,
    private router: Router,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private authService: AuthService,  // ✅ renamed
  ) {}

  ngOnInit() {
    // Check if the user is already logged in when the page loads
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  async login() {
    const loading = await this.loadingCtrl.create({ message: 'Logging in...' });
    await loading.present();

    this.http.post<any>(`${this.BASE_URL}/login`, {
      email: this.loginEmail,
      password: this.loginPassword,
    }).subscribe(
      async (res) => {
        await loading.dismiss();
        if (res.token) {
          this.authService.setUserData(res.user);
          localStorage.setItem('auth_token', res.token);
          this.router.navigateByUrl('/dashboard', { replaceUrl: true });
        } else {
          const alert = await this.alertCtrl.create({
            header: 'Login Failed',
            message: 'Token not found in response.',
            buttons: ['OK'],
          });
          await alert.present();
        }
      },
      async (err) => {
        await loading.dismiss();
        const alert = await this.alertCtrl.create({
          header: 'Login Failed',
          message: err.error?.message || 'Invalid email or password.',
          buttons: ['OK'],
        });
        await alert.present();
      }
    );
  }

  async register() {
  const loading = await this.loadingCtrl.create({ message: 'Registering...' });
  await loading.present();

  this.http.post<any>(`${this.BASE_URL}/register`, {
    username: this.registerName,   // ✅ changed from name → username
    email: this.registerEmail,
    password: this.registerPassword,
  }).subscribe(
    async (res) => {
      await loading.dismiss();
      const alert = await this.alertCtrl.create({
        header: 'Success',
        message: 'Registration successful. You can now log in.',
        buttons: ['OK'],
      });
      await alert.present();
      this.isRegistering = false;
    },
    async (err) => {
      await loading.dismiss();
      const alert = await this.alertCtrl.create({
        header: 'Registration Failed',
        message: err.error?.message || 'Could not register.',
        buttons: ['OK'],
      });
      await alert.present();
    }
  );
}


  toggleMode() {
    this.isRegistering = !this.isRegistering;
  }
}
