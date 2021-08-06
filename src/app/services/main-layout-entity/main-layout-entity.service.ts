import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ContentPresenterWithSeries } from '../../api-converters/time-series/request/dstm-series-request-converter';
import { MainLayout } from '../../model/layout';
import { TimeSeriesIdentifier } from '../../model/timeseries';

const createTestData = (): MainLayout => {

    const timeSeries: Array<TimeSeriesIdentifier> = [...Array(20).keys()].map(i => {

      return ({
        modelIdentifier: { modelKey: `${++i}`,
                          attributeId: `${i}`,
                          componentId: i,
                          componentType: i,
                          hpsId: i,
                        },
        displayAttributes: { displayName: `Series ${i}`,
                             objectName: `Series ${i}`,
                          }
    })});

    return {
        id: 1,
        name: '',
        content: [
            {
                id: 1,
                presenter: 'table',
                title: 'Test table',
                position: {
                    rowStart: 1,
                    rowEnd: 2,
                    columnStart: 1,
                    columnEnd: 2,
                },
                timeSeries,
            } as ContentPresenterWithSeries,
        ],
        payloadDate: 1,
    };
};

@Injectable({
    providedIn: 'root',
})
export class MainLayoutEntityService {
    public entities$: Observable<Array<MainLayout>> = of([createTestData()]);
}
