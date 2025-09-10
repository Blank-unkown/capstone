import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HomePage } from './app/home/home.page';
import { environment } from './environments/environment';
import { enableProdMode } from '@angular/core';

if (environment.production) {
  enableProdMode();
}
// src/opencv.d.ts
declare var cv: any;


platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));

