import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { ResultviewerPageRoutingModule } from './resultviewer-routing.module';

import { ResultviewerPage } from './resultviewer.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ResultviewerPageRoutingModule,
    RouterModule.forChild([{ path: '', component: ResultviewerPage }]),
    ResultviewerPage
  ]
})
export class ResultviewerPageModule {}
