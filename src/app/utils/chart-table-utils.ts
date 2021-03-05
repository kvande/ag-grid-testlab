import { subSeconds } from 'date-fns';
import { filter, map, tap } from 'rxjs/operators';
import { TimeSeriesWithData, TimeSeriesUtil, TimeSeriesIdentifier, TimeSeries } from '../time-series';

export interface ViewWithTimeSeries {
    viewId: number;
    requestId?: string;
    timeSeries: Array<TimeSeriesWithData<number>>;
}

export function getRequestedSeries(all: Array<TimeSeriesWithData<number>>, requested: Array<TimeSeriesIdentifier>): Array<TimeSeriesWithData<number>> {

    const seriesForThis = new Array<TimeSeriesWithData<number>>();
    const empty = (s: Array<any>) => (s ?? []).length <= 0;

    if (empty(all) || empty(requested)) return seriesForThis;

    requested.forEach(s => {
        const match = all.filter(i => TimeSeriesUtil.sameSeries(i, s));
        match?.forEach(m => seriesForThis.push(m));
    });

    return seriesForThis;
}

export function getDisplayName(all: Array<TimeSeriesIdentifier>, series: TimeSeries): string {

    
    return series.displayName ?? series.attributeId;
    
    // const match = all?.find(i => TimeSeriesUtil.sameSeries(i, series));
    // return match?.displayName ?? (series?.id?.toString() ?? '');
}


// rxjs operator for getting changed series for a given view
// why this operator: ngrx emits all series, have to find the ones that actual was reported
// as changed by the back end (like one series in a chart, not all of them)
export function changedSeriesForView(viewId: number, previousPayloadDates: Array<[TimeSeriesIdentifier, number]>) {

    return source$ => source$.pipe(
        map((i: Array<ViewWithTimeSeries>) => i.filter(j => j.viewId === viewId)),
        filter((i: Array<ViewWithTimeSeries>) => !!i && i.length > 0),
        map((i: Array<ViewWithTimeSeries>) => {

            const changedSeries = new Array<TimeSeriesWithData<number>>();

            i.forEach(batch => {

                for (const series of batch.timeSeries) {
                    const index = previousPayloadDates.findIndex(([ts, _]) => TimeSeriesUtil.sameSeries(ts, series));

                    if (index >= 0) {
                        
                        if (previousPayloadDates[index][1] < series.payloadDate) {
                            previousPayloadDates[index][1] = series.payloadDate;
                            changedSeries.push(series);
                        }
                    } else {
                        changedSeries.push(series);
                        previousPayloadDates.push([series, series.payloadDate]);
                    }
                }
            });

            return changedSeries;
        }),

        filter((i: Array<TimeSeriesWithData<number>>) => i.length > 0)

    );
}

// (ak 02.03.2021) the api will allways return the entire set of series
// so if user change one series, the api will return all series, instead of the delta. Must therefore update those series
// it they already exists (do not change any attritbutes, just update the series values)
export function updateExisting(newSeries: Array<TimeSeriesWithData<number>>, existingSeries: Array<any>): Array<TimeSeriesIdentifier> {

    const updatedSeries = [];

    newSeries.forEach(n => {

        const match: any = existingSeries.find(j => TimeSeriesUtil.sameSeries(j.identifier, n));

        if (match) {

            match.data = n.data.map(([t, v]) => [t * 1000, v]);
            updatedSeries.push(createTimeSeriesIdentifier(match.identifier));
        }
    })

    return updatedSeries;
}

export function excludeSeries<T extends TimeSeriesIdentifier>(all: Array<T>, exclude: Array<TimeSeriesIdentifier>): Array<T> {

    const hasItems = (s: Array<any>) => (s?.length ?? 0) > 0;

    if (!hasItems(all) || !hasItems(exclude)) return all;
    
    const copy = all.slice();

    exclude.forEach(i => {
        
        const index = copy.findIndex(j => TimeSeriesUtil.sameSeries(j, i));
        if (index >= 0) copy.splice(index);
    }); 

    return copy;
}

export function createTimeSeriesIdentifier(ts: TimeSeriesWithData<number>): TimeSeriesIdentifier {

    const  { hpsId, componentId, componentType, attributeId } = ts;
    return { hpsId, componentId, componentType, attributeId };
}