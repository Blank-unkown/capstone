import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./pages/dashboard/dashboard.module').then(m => m.DashboardPageModule)
  },
  {
    path: 'class-list',
    loadChildren: () => import('./pages/class-list/class-list.module').then(m => m.ClassListPageModule)
  },
  {
    path: 'subject-list/:id',
    loadChildren: () => import('./pages/subject-list/subject-list.module').then(m => m.SubjectListPageModule)
  },
  {
    path: 'tos/:classId/:subjectId',
    loadChildren: () => import('./pages/tos/tos.module').then(m => m.TosPageModule)
  },
  {
  path: 'answer-sheet-generator/:classId/:subjectId',
  loadChildren: () => import('./pages/answer-sheet-generator/answer-sheet-generator.module').then(m => m.AnswerSheetGeneratorPageModule)
  },
  {
  path: 'question-generator/:classId/:subjectId',
  loadChildren: () => import('./pages/question-generator/question-generator.module').then(m => m.QuestionGeneratorPageModule)
},
  {
    path: 'scan',
    loadChildren: () => import('./pages/scan/scan.module').then( m => m.ScanPageModule)
  },
  {
    path: 'resultviewer',
    loadChildren: () => import('./pages/resultviewer/resultviewer.module').then( m => m.ResultviewerPageModule)
  },
  {
  path: 'answer-key/:classId/:subjectId',
  loadChildren: () => import('./pages/answer-key/answer-key.module').then(m => m.AnswerKeyPageModule)
},



];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
