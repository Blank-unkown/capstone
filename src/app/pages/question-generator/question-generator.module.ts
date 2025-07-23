import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { QuestionGeneratorPageRoutingModule } from './question-generator-routing.module';
import { RouterModule } from '@angular/router';
import { QuestionGeneratorPage } from './question-generator.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    QuestionGeneratorPageRoutingModule,
    RouterModule.forChild([{ path: '', component: QuestionGeneratorPage }]),
    QuestionGeneratorPage
  ]
})
export class QuestionGeneratorPageModule {}
