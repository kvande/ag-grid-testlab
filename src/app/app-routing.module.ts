import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { TableComponent } from './table-data/table.component';
import { AgGridModule } from 'ag-grid-angular';
import { LandingComponent } from './landing/landing.component';
import { ReadOnlyComponent } from './read-only/read-only.component';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'table-data', component: TableComponent },
  { path: 'read-only', component: ReadOnlyComponent }
]


@NgModule({
  declarations: [
    LandingComponent,
    TableComponent,
    ReadOnlyComponent
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
