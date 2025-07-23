import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ClassListPage } from './class-list.page';

const routes: Routes = [
  {
    path: '',
    component: ClassListPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClassListPageRoutingModule {}
