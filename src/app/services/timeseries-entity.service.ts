import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TimeSeriesWithData } from '../time-series';
import { tableData$ } from '../table/table-data';

@Injectable({
    providedIn: 'root'
})
export class TimeSeriesEntityService {

    public entities$: Observable<Array<TimeSeriesWithData<number>>> = tableData$();


    public update = (change: any) =>  console.log('Should update', change);

    
}
