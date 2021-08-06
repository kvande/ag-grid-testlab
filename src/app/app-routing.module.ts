import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { TableDataComponent } from './table-data/table-data.component';
import { AgGridModule } from 'ag-grid-angular';
import { LandingComponent } from './landing/landing.component';
import { TableReadOnlyComponent } from './table-read-only/table-read-only.component';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'table-data', component: TableDataComponent },
  { path: 'read-only', component: TableReadOnlyComponent }
]


@NgModule({
  declarations: [
    LandingComponent,
    TableDataComponent,
    TableReadOnlyComponent
  ],
  imports: [
    CommonModule,
    AgGridModule.withComponents([]),
    RouterModule.forRoot(routes, { enableTracing: false })
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }
