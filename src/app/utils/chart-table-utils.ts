import { map } from 'rxjs/operators';
import { ContentPresenterWithSeries } from '../api-converters/time-series/request/dstm-series-request-converter';
import { MainLayout, MainLayoutUtils } from '../model/layout';
import { TimeSeriesWithData, TimeSeriesUtil, TimeSeriesIdentifier, TimeSeries, TimeSeriesVisualization } from '../model/timeseries';
import { ViewWithTimeSeries } from '../services/time-series-entity/time-series-data.service';


export interface SeriesUpdate {
    addedSeries: Array<TimeSeriesIdentifier>;
    removedSeries: Array<TimeSeriesIdentifier>;
    updatedSeries: Array<TimeSeriesIdentifier>;
    series: Array<ViewWithTimeSeries>;
}


export const findSeries = (seriesId: {identifier: TimeSeriesIdentifier}, all: Array<TimeSeriesIdentifier>) => {
    return all.find(i => TimeSeriesUtil.sameSeries(seriesId.identifier, i));
}

export const getRequestedSeries = (all: Array<TimeSeriesWithData<number>>, requested: Array<TimeSeriesIdentifier>): Array<TimeSeriesWithData<number>> => {

    const seriesForThis = new Array<TimeSeriesWithData<number>>();
    const empty = (s: Array<any>) => (s ?? []).length <= 0;

    if (empty(all) || empty(requested)) return seriesForThis;

    requested.forEach(s => {
        const match = all.filter(i => TimeSeriesUtil.sameSeries(i, s));
        match?.forEach(m => seriesForThis.push(m));
    });

    return seriesForThis;
}

export const getDisplayAttributes = (series: TimeSeriesIdentifier, all: Array<TimeSeriesIdentifier>, includeCaseId: boolean = false, includeScenarioId: boolean = false) => {

    const match = all?.find(i => isSameSeriesNeglectingCaseAndScenarioId(i, series));
    const caseId = includeCaseId ? series?.modelIdentifier?.caseId ?? undefined : undefined;
    const scenarioId = includeScenarioId ? series?.modelIdentifier?.scenarioId ?? undefined : undefined;

    let { displayName, objectName, seriesType = '' } = match?.displayAttributes ?? {}

    const caseAndScenarioId = `${(caseId ? ` # run-${caseId}`: '')}${(scenarioId ? ` # sc-${scenarioId}`: '')}`

    displayName = displayName ? `${displayName}${caseAndScenarioId}` : '';
    objectName = objectName ? `${objectName}${caseAndScenarioId}` : '';

    return { displayName, objectName, seriesType };
}

export const getDisplayName = (series: TimeSeries, all: Array<TimeSeriesIdentifier>, includeCaseId: boolean = false, includeScenarioId: boolean = false): string => {

    return getDisplayAttributes(series, all, includeCaseId, includeScenarioId).displayName;
}

export const getCaseAndScenarioId = (series: TimeSeriesIdentifier): { caseId: string, scenarioId: string } => {

    const { caseId = '', scenarioId = '' } = series?.modelIdentifier ?? series?.urlIdentifier ?? {};
    return { caseId, scenarioId };
}

export const isSameSeriesNeglectingCaseAndScenarioId = (seriesOne: TimeSeriesIdentifier, seriesTwo: TimeSeriesIdentifier) => {

    const createIdentifier = (s: TimeSeriesIdentifier) => (
        { modelIdentifier: { ...s.modelIdentifier, caseId: undefined, scenarioId: undefined },
          urlIdentifier: {...s.urlIdentifier}} );

    return TimeSeriesUtil.sameSeries(createIdentifier(seriesOne), createIdentifier(seriesTwo));
}

export const createDataSeries = (series: TimeSeriesWithData<number>, useMilliseconds: boolean = true, scalingFactor: number = 1): Array<[number, number]> => {

    if ((series?.data?.length ?? 0) <= 0) return [];

    const m = useMilliseconds ? 1000 : 1;
    const scaleValue = (v: number | null | undefined) => (v === null || v === undefined) ? undefined : v * scalingFactor;

    return scalingFactor === 1
            ? series.data.map(([t, v]) => [t * m, v])
            : series.data.map(([t, v]) => [t * m, scaleValue(v)]);
}

// rxjs operator for getting changed series for a given view
// why this operator: ngrx emits all series, have to find the ones that actual was reported
// as changed by the back end (like one series in a chart, not all of them)
export const changedSeriesForViewOperator = (viewId: number, previousPayloadDates: Array<[TimeSeriesIdentifier, number]>) => {

    return source$ => source$.pipe(
        map((i: SeriesUpdate) => {

            const addedOrUpdated = new Array<TimeSeriesWithData<number>>();
            const seriesForView: Array<TimeSeriesWithData<number>> = i.series.filter(j => j.viewId === viewId)
                                          .map(i => i.timeSeries)
                                          .reduce((p, n) => [...p, ...n], []);

            const addedOrUpdatedSeries = [...i.addedSeries, ...i.updatedSeries]

            addedOrUpdatedSeries.forEach(addedSeries => {

                const series = seriesForView.find(j => TimeSeriesUtil.sameSeries(addedSeries, j));

                if (series) {

                    const index = previousPayloadDates.findIndex(([ts, _]) => TimeSeriesUtil.sameSeries(ts, series));

                    if (index >= 0) {

                        if (previousPayloadDates[index][1] < series.payloadDate) {
                            previousPayloadDates[index][1] = series.payloadDate;
                            addedOrUpdated.push(series);
                        }
                    } else {
                        addedOrUpdated.push(series);
                        previousPayloadDates.push([series, series.payloadDate]);
                    }
                }
            });

            return { addedOrUpdated, removed: i.removedSeries };
        })
    );
}

// rxjs operator for removing series not in the current view
export const filterForIncludedSeriesOperator = (getSeriesInView: () => Array<TimeSeriesIdentifier>) => {
    return source$ => source$.pipe(
        map((i: Array<TimeSeriesIdentifier>) =>{

            const seriesInView = getSeriesInView() ?? [];
            return i.filter(s => seriesInView.find(v => TimeSeriesUtil.sameSeries(s, v)))
        })
    );
}

// (ak 02.03.2021) the api will allways return the entire set of series
// so if user change one series, the api will return all series, instead of the delta. Must therefore update those series
// it they already exists (do not change any attritbutes, just update the series values)
export const updateExisting = (newSeries: Array<TimeSeriesWithData<number>>,
                               existingSeries: Array<{identifier: TimeSeriesIdentifier, data: Array<[number, number]>}>,
                               timeSeriesAttributes: Array<TimeSeriesIdentifier & { scalingFactor?: number}>): Array<TimeSeriesIdentifier> => {

    const updatedSeries = [];

    newSeries.forEach(n => {

        const match: any = existingSeries.find(j => TimeSeriesUtil.sameSeries(j.identifier, n));

        if (match) {

            const scalingFactor = getScalingFactor(match, timeSeriesAttributes) ?? 1;

            match.data = createDataSeries(n, true, scalingFactor);
            updatedSeries.push(createTimeSeriesIdentifier(match.identifier));
        }
    })

    return updatedSeries;
}

export const excludeSeries = <T extends TimeSeriesIdentifier>(all: Array<T>, exclude: Array<TimeSeriesIdentifier>): Array<T> => {

    const hasItems = (s: Array<any>) => (s?.length ?? 0) > 0;

    if (!hasItems(all) || !hasItems(exclude)) return all;

    const copy = all.slice();

    exclude.forEach(i => {

        const index = copy.findIndex(j => TimeSeriesUtil.sameSeries(j, i));
        if (index >= 0) copy.splice(index);
    });

    return copy;
}

export const createTimeSeriesIdentifier = (ts: TimeSeriesWithData<number>, all: Array<TimeSeriesIdentifier> = []): TimeSeriesIdentifier => {

    const { modelIdentifier, urlIdentifier } = ts;
    const { hpsId, marketId, componentId, componentType, attributeId, modelKey, caseId, scenarioId } = modelIdentifier ?? {};
    const { objectName = '', seriesType = '' } = all ? getDisplayAttributes(ts, all, false) : {};

    return {
        modelIdentifier: modelIdentifier ? { hpsId, marketId, componentId, componentType, attributeId, modelKey, caseId, scenarioId } : undefined,
        urlIdentifier: urlIdentifier ? { ...urlIdentifier } : undefined,
        source: ts?.source,
        displayAttributes: {
            displayName: '',
            objectName,
            seriesType
        }
    };
}

export const getScalingFactor = (seriesId: {identifier: TimeSeriesIdentifier}, all: Array<TimeSeriesIdentifier & { scalingFactor?: number}>) => {

    return getPropertyForSeries<{scalingFactor?: number}>(seriesId, all, v  => v?.scalingFactor ?? 1) ?? 1;
}

export const getSeriesIsReadOnly = (seriesId: {identifier: TimeSeriesIdentifier}, all: Array<TimeSeriesIdentifier & { readOnly?: number}>) => {

    return getPropertyForSeries<{readOnly?: number}>(seriesId, all, v  => v?.readOnly ?? false) ?? false;
}

const getPropertyForSeries = <T>(seriesId: {identifier: TimeSeriesIdentifier}, all: Array<TimeSeriesIdentifier>,
                                    getAttribute: (v: TimeSeriesIdentifier & T) => any, defaultValue: any = undefined) => {

    if (!seriesId || (all?.length ?? 0) <= 0) return defaultValue;

    const match = findSeries(seriesId, all);

    return match ? getAttribute(match as any) : defaultValue;
}

export const getSeriesInView = (viewId: number, layout: MainLayout): Array<TimeSeriesIdentifier> => {

    const match = MainLayoutUtils.findFirstFromLayout(layout, (i) => i.id === viewId);
    const series = (match as ContentPresenterWithSeries)?.timeSeries;

    return series ? filterOutTemplateSeries(series) : [];
}

export const getAddedSeries = (previous: Array<TimeSeriesIdentifier>, next: Array<TimeSeriesIdentifier>, includeTemplateSeries: boolean = false): Array<TimeSeriesIdentifier> => {

    const tryFindTemplateSeries = (i: TimeSeriesIdentifier, n: Array<TimeSeriesIdentifier>) => !n.find(j => TimeSeriesUtil.sameTemplateSeries(i, j));
    const tryFindSeries = (i: TimeSeriesIdentifier, n: Array<TimeSeriesIdentifier>) => !n.find(j => TimeSeriesUtil.sameSeries(i, j));

    return getChangesInSeriesSet(next, previous, tryFindTemplateSeries, tryFindSeries, includeTemplateSeries);
}

export const getRemovedSeries = (previous: Array<TimeSeriesIdentifier>, next: Array<TimeSeriesIdentifier>, includeTemplateSeries: boolean = false): Array<TimeSeriesIdentifier> => {

    const tryFindTemplateSeries = (i: TimeSeriesIdentifier, n: Array<TimeSeriesIdentifier>) => !n.find(j => TimeSeriesUtil.sameTemplateSeries(i, j));
    const tryFindSeries = (i: TimeSeriesIdentifier, n: Array<TimeSeriesIdentifier>) => !n.find(j => TimeSeriesUtil.sameSeries(i, j));

    return getChangesInSeriesSet(previous, next, tryFindTemplateSeries, tryFindSeries, includeTemplateSeries);
}

export const getUpdateSeries = (previous: Array<TimeSeriesIdentifier>, next: Array<TimeSeriesIdentifier>, includeTemplateSeries: boolean = false): Array<TimeSeriesIdentifier> => {

    const tryFindTemplateSeries = (i: TimeSeriesIdentifier, n: Array<TimeSeriesIdentifier>) => n.find(j => TimeSeriesUtil.sameTemplateSeries(i, j)) !== undefined;
    const tryFindSeries = (i: TimeSeriesIdentifier, n: Array<TimeSeriesIdentifier>) => n.find(j => TimeSeriesUtil.sameSeries(i, j)) !== undefined;

    return getChangesInSeriesSet(next, previous, tryFindTemplateSeries, tryFindSeries, includeTemplateSeries);
}

const getChangesInSeriesSet = (first: Array<TimeSeriesIdentifier>, second: Array<TimeSeriesIdentifier>,
                                checkTemplateSeries: (i: TimeSeriesIdentifier, n: Array<TimeSeriesIdentifier>) => boolean,
                                 checkSeries: (i: TimeSeriesIdentifier, n: Array<TimeSeriesIdentifier>) => boolean,
                                  includeTemplateSeries: boolean = false): Array<TimeSeriesIdentifier> => {

    const series = new Array<TimeSeriesIdentifier>();
    const n = second?.slice() ?? [];

    (first ?? []).forEach(i => {

        const isTemplatedSeries = isTemplateSeries(i);

        if (includeTemplateSeries && isTemplatedSeries && checkTemplateSeries(i, n)) {
            series.push(i);

        } else if (!isTemplatedSeries && checkSeries(i, n)) {
            series.push(i);
        }
    })

    return series;
}

export const filterOutTemplateSeries = (series: Array<TimeSeriesIdentifier>): Array<TimeSeriesIdentifier> => {

    return (series?.length ?? 0) > 0
            ? series.filter(i => !isTemplateSeries(i))
            : [];
}

const isTemplateSeries = (series: TimeSeriesIdentifier) => series.modelTemplateIdentifier || series.urlTemplateIdentifier;
