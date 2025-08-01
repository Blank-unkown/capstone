import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TosPageRoutingModule } from './tos-routing.module';
import { RouterModule } from '@angular/router';
import { TosPage } from './tos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TosPageRoutingModule,
    RouterModule.forChild([{ path: '', component: TosPage }]),
    TosPage
  ]
})
export class TosPageModule {}
