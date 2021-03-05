import { interval, Observable, of } from "rxjs";
import { TimeSeriesWithData, ViewWithTimeSeries } from "../time-series";
import { addHours } from 'date-fns';
import { map, take } from "rxjs/operators";

export const tableData$ = ():  Observable<Array<TimeSeriesWithData<number>>> => {

    return interval(50).pipe(
        take(12),
        map(j => {
            
            const series = [];

            for (let i = j; i < 5 + j; i++) {
                series.push(createTs(`Series ${i}`, j))
            }


            return series;
        })
    )
}


const createTs = (name: string, firstValue: number): TimeSeriesWithData<number> => {


    console.log(firstValue);

    const firstTimeStep = new Date(2021, 1, 29, 11, 0, 0);

    const data: Array<[number, number]> = [...Array(8).keys()].map(i => {
        return [addHours(firstTimeStep, i).getTime() / 1000, firstValue];
    });

    return {
        attributeId: name,
        componentId: 1,
        componentType: 1,
        hpsId: 1,
        data,
        id: 1,
        payloadDate: 1
    };
}
