import { Component, OnInit } from '@angular/core';
import { TimeSeriesIdentifier } from '../../model/timeseries';
import { ITooltipAngularComp } from 'ag-grid-angular';
import { ITooltipParams } from 'ag-grid-community';

export interface TooltipData {
  getTimeSeriesAtRow: (rowIndex: number) => TimeSeriesIdentifier;
}

@Component({
  selector: 'app-table-tooltip',
  template: '<div></div>',
  styles: [`div: { height: 0px}`]
})
export class TableTooltipComponent  implements ITooltipAngularComp {

  // just a dummy implementation
  public agInit(params: TooltipData & ITooltipParams): void { }
}

