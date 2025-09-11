import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'https://capstone-wwbm.onrender.com/auth'; // ✅ backend route

  constructor(private http: HttpClient) {}
   register(user: { username: string; email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  // ✅ check if token exists
  public isLoggedIn(): boolean {
    return localStorage.getItem('auth_token') !== null;
  }

  // ✅ get auth token
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // ✅ get stored user info
  getUserData(): any {
    const data = localStorage.getItem('userData');
    return data ? JSON.parse(data) : null;
  }

  // ✅ helper to get user ID directly
  getCurrentUserId(): number {
    const userData = this.getUserData();
    return userData?.id || 0;
  }
  
  // ✅ store user info
  setUserData(user: any) {
    localStorage.setItem('userData', JSON.stringify(user));
  }

  // ✅ clear everything
  logout() {
    localStorage.removeItem('userData');
    localStorage.removeItem('auth_token');
  }
}
