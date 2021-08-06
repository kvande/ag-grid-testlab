import { interval, Observable } from "rxjs";
import { TimeSeriesWithData } from "../model/timeseries";
import { addHours } from 'date-fns';
import { map, take } from "rxjs/operators";
import { ViewWithTimeSeries } from "../services/time-series-entity/time-series-data.service";

export const tableData$ = (): Observable<Array<ViewWithTimeSeries>> => {

    return interval(100).pipe(
        take(12),
        map(j => {
            
            const timeSeries = new Array<TimeSeriesWithData<number>>();

            for (let i = j; i < 5 + j; i++) {
                timeSeries.push(createTs(`Series ${i}`, j))
            }
            return [{
                viewId: 1,
                requestId: 'some kind of request id',
                timeSeries

            } as ViewWithTimeSeries];
        })
    )
}


const createTs = (name: string, firstValue: number): TimeSeriesWithData<number> => {

    const firstTimeStep = new Date(2021, 1, 29, 11, 0, 0);

    const data: Array<[number, number]> = [...Array(8).keys()].map(i => {
        return [addHours(firstTimeStep, i).getTime() / 1000, firstValue];
    });

    return {
        modelIdentifier: {
            attributeId: '1',
            componentId: 1,
            componentType: 1,
            hpsId: 1,
            modelKey: 'key'
        },
        data,
        id: 1,
        payloadDate: Date.now(),
    };
}
