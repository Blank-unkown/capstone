import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AnswerKeyPage } from './answer-key.page';

const routes: Routes = [
  {
    path: '',
    component: AnswerKeyPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AnswerKeyPageRoutingModule {}
