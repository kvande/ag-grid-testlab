import { CellFocusedEvent, CellValueChangedEvent, RowNode, SortChangedEvent } from 'ag-grid-community';
import { TimeSeriesIdentifier, TimeSeriesSource, TimeSeriesUtil, TimeSeriesWithData } from '../model/timeseries';
import { TimeSeriesEntityService } from '../services/time-series-entity/time-series-entity.service';
import { getScalingFactor } from '../utils/chart-table-utils';

export const cellFocused = (event: CellFocusedEvent) => {

    // console.l('*** cellFocused ***');
}

// returns a new array, taking the new order into consideration
export const getWithNextSorting = (event: SortChangedEvent, rowIndexForTimeSeries: Array<[rowIndex: number, rowId: string, seriesId: TimeSeriesIdentifier]>) => {
    
    const rows = (event.api as any)?.rowModel.rowsToDisplay as Array<RowNode>;
    const updated = new Array<[rowIndex: number, rowId: string, seriesId: TimeSeriesIdentifier]>();

    if (rows) {

        rowIndexForTimeSeries.forEach(([_, rowId, seriesId]) => {

            const newIndex = rows.find(j => j.id === rowId).rowIndex;
            updated.push([newIndex, rowId, seriesId]);
        });
    }

    // makes it more visual pleasing in the debugger to have this sorted, not required for the code to function properly
    updated.sort((a, b) => a[0] > b[0] ? 1 : -1);
    return updated;
}

// an arbitrary number of cells might have changed in the grid; create one single update request to the backend
export const cellsValueChanged = (events: Array<CellValueChangedEvent>, viewId: number, rowIndexForTimeSeries: Array<[number, string, TimeSeriesIdentifier]>,
                                   all: Array<TimeSeriesIdentifier & { scalingFactor?: number}>,
                                    timeSeriesEntityService: TimeSeriesEntityService) => {

    const series = new Array<TimeSeriesWithData<number>>();

    events.forEach(event => {

        // might happen if just tabbing in and out of cells
        if (event.newValue !== event.oldValue) {
            
            const match = rowIndexForTimeSeries?.find(i => i[0] === event.rowIndex);

            const { modelIdentifier = undefined, urlIdentifier = undefined, source = TimeSeriesSource.undefined } = match ? match[2] : {};
            const { modelKey = '', hpsId = 0, marketId = 0 } = modelIdentifier ?? {};

            const scalingFactor = getScalingFactor({ identifier: match ? match[2] : undefined }, all);

            if (hpsId > 0 && modelKey.length > 0) {
                appendToSeries(series, match[2], (event.colDef as any).date, event.newValue, scalingFactor);

            } else if (marketId > 0 && modelKey.length > 0) {
                appendToSeries(series, match[2], (event.colDef as any).date, event.newValue, scalingFactor);

            } else if ((urlIdentifier?.url?.length ?? 0) > 0) {
                appendToSeries(series, { urlIdentifier, source }, (event.colDef as any).date, event.newValue, scalingFactor);
            }
        }
    });

    sortSeriesAccordingToDate(series);
    timeSeriesEntityService.update({ viewId, timeSeries: series });
}

// when pasting data into the grid the values are a strings, when typing directly into table it is a number
const appendToSeries = (series: Array<TimeSeriesWithData<number>>, timeSeriesId: TimeSeriesIdentifier, date: number, value: number | string, scalingFactor: number) => {

    const match = series.find(i => TimeSeriesUtil.sameSeries(i, timeSeriesId))
                  ?? addSeries(series, timeSeriesId);

    const v = !Number.isNaN(+value) ? +value : Number.parseFloat(value as string);

    match.data.push([date, (v / scalingFactor) as number]);
}

const addSeries = (series: Array<TimeSeriesWithData<number>>, timeSeriesId: TimeSeriesIdentifier): TimeSeriesWithData<number> => {

    const s: TimeSeriesWithData<number> = { id: TimeSeriesUtil.createIdFromTimeSeriesIdentifier(timeSeriesId),
                                            ...timeSeriesId,
                                            data: [],
                                            payloadDate: Date.now() };
    series.push(s);
    return s;
}

const sortSeriesAccordingToDate = (series: Array<TimeSeriesWithData<number>>) => {

    series.forEach(s => { 
        s.data?.sort(([t1, v1], [t2, v2]) => t1 > t2 ? 1 : -1);
    });

}

