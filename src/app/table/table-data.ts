import { Observable, of } from "rxjs";
import { TimeSeriesWithData, ViewWithTimeSeries } from "../time-series";


export const tableData$ = ():  Observable<Array<ViewWithTimeSeries>> => {

    return of([
        {
            viewId: 123,
            requestId: 'this is the request id',
            timeSeries: [
                createTs()
            ]
        }
    ]);

}


const createTs = (): TimeSeriesWithData<number> => {

    return {
        attributeId: 'power-ts',
        componentId: 1,
        componentType: 1,
        hpsId: 1,
        data: [],
        id: 1,
        payloadDate: 1,

    }

}