import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { QuestionBankPageRoutingModule } from './question-bank-routing.module';
import { RouterModule } from '@angular/router';
import { QuestionBankPage } from './question-bank.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    QuestionBankPageRoutingModule,
    RouterModule.forChild([{ path: '', component: QuestionBankPage }]),
    QuestionBankPage
  ]
})
export class QuestionBankPageModule {}
