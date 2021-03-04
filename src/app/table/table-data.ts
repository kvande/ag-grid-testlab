import { Observable, of } from "rxjs";
import { TimeSeriesWithData, ViewWithTimeSeries } from "../time-series";
import { addHours } from 'date-fns';

export const tableData$ = ():  Observable<Array<TimeSeriesWithData<number>>> => {

    return of([
            createTs('Series one'),
            // createTs('Series two'),
    ]);

}


const createTs = (name: string): TimeSeriesWithData<number> => {

    const firstTimeStep = new Date(2021, 1, 29, 11, 0, 0);

    const data: Array<[number, number]> = [...Array(8).keys()].map(i => {
        return [addHours(firstTimeStep, i).getTime() / 1000, i];
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

// 0: Array(2)
// 0: 1614747600
// 1: 105
// length: 2

1582970400
1614747600