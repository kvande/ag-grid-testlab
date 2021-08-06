import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tableData$ } from '../../table-data';
import { ViewWithTimeSeries } from './time-series-data.service';

@Injectable({
    providedIn: 'root'
})
export class TimeSeriesEntityService {

    public entities$: Observable<Array<ViewWithTimeSeries>> = tableData$();


    public update = (change: any) => console.log('Should update', change);


}
