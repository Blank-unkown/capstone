import { Component } from '@angular/core';
import { LocalDataService } from './services/local-data.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor() {
  this.initializeApp();
}

async initializeApp() {
  await LocalDataService.load();
}
}
