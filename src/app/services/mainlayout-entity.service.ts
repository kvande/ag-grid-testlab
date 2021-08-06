import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MainLayout } from '../model/layout';
// import { TimeSeriesWithData, ViewWithTimeSeries } from '../time-series';
// import { tableData$ } from '../table-data/table-data';


@Injectable({
    providedIn: 'root'
})
export class MainLayoutEntityService {

    public entities$: Observable<Array<MainLayout>> = of(undefined);

}
