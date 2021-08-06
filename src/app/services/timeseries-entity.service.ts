import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TimeSeriesWithData, ViewWithTimeSeries } from '../time-series';
import { tableData$ } from '../table-data/table-data';

@Injectable({
    providedIn: 'root'
})
export class TimeSeriesEntityService {

    public entities$: Observable<Array<ViewWithTimeSeries>> = tableData$();


    public update = (change: any) => console.log('Should update', change);


}
