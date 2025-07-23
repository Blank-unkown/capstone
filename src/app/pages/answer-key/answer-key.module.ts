import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AnswerKeyPageRoutingModule } from './answer-key-routing.module';
import { RouterModule } from '@angular/router';
import { AnswerKeyPage } from './answer-key.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AnswerKeyPageRoutingModule,
    RouterModule.forChild([{ path: '', component: AnswerKeyPage }]),
    AnswerKeyPage
  ]
})
export class AnswerKeyPageModule {}
