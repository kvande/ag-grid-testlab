import { interval, Observable } from "rxjs";
import { TimeSeriesWithData } from "./model/timeseries";
import { addHours } from 'date-fns';
import { map, take } from "rxjs/operators";
import { ViewWithTimeSeries } from "./services/time-series-entity/time-series-data.service";

export const tableData$ = (intervalMilliseconds: number = 1): Observable<Array<ViewWithTimeSeries>> => {

    return interval(intervalMilliseconds).pipe(
        take(12),
        map(j => {

            const timeSeries = new Array<TimeSeriesWithData<number>>();

            for (let i = j; i < 5 + j; i++) {
                timeSeries.push(createTs(i + 1, j))
            }
            return [{
                viewId: 1,
                requestId: 'some kind of request id',
                timeSeries

            } as ViewWithTimeSeries];
        })
    )
}

const createTs = (id: number, firstValue: number): TimeSeriesWithData<number> => {

    const firstTimeStep = new Date(2021, 1, 29, 11, 0, 0);

    const data: Array<[number, number]> = [...Array(10).keys()].map(i => {
        return [addHours(firstTimeStep, i).getTime() / 1000, firstValue];
    });

    return {
        modelIdentifier: {
            attributeId: `${id}`,
            componentId: id,
            componentType: id,
            hpsId: id,
            modelKey: `${id}`
        },
        data,
        id: 1,
        payloadDate: Date.now(),
    };
}
