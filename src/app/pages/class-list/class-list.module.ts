import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ClassListPageRoutingModule } from './class-list-routing.module';
import { RouterModule } from '@angular/router';
import { ClassListPage } from './class-list.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ClassListPageRoutingModule,
    RouterModule.forChild([{ path: '', component: ClassListPage }]),
    ClassListPage
  ],
})
export class ClassListPageModule {}
