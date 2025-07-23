import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SubjectListPage } from './subject-list.page';

const routes: Routes = [
  {
    path: '',
    component: SubjectListPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SubjectListPageRoutingModule {}
