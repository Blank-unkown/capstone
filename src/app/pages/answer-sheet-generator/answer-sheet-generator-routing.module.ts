import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AnswerSheetGeneratorPage } from './answer-sheet-generator.page';

const routes: Routes = [
  {
    path: '',
    component: AnswerSheetGeneratorPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AnswerSheetGeneratorPageRoutingModule {}
