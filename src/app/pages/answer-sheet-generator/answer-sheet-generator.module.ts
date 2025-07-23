import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { AnswerSheetGeneratorPageRoutingModule } from './answer-sheet-generator-routing.module';
import { AnswerSheetGeneratorPage } from './answer-sheet-generator.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AnswerSheetGeneratorPageRoutingModule,
    RouterModule.forChild([{ path: '', component: AnswerSheetGeneratorPage }]),
    AnswerSheetGeneratorPage
  ],

})
export class AnswerSheetGeneratorPageModule {}
