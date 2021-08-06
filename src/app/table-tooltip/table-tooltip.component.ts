import { Component, OnInit } from '@angular/core';
import { TimeSeriesIdentifier } from '../model/timeseries';

export interface TooltipData {
  getTimeSeriesAtRow: (rowIndex: number) => TimeSeriesIdentifier;
}

@Component({
  selector: 'app-table-tooltip',
  templateUrl: './table-tooltip.component.html',
  styleUrls: ['./table-tooltip.component.scss']
})
export class TableTooltipComponent {

    // just a dummy implementation
}
