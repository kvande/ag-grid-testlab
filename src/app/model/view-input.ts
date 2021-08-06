import { ChartAxis, ContentPresenter, scrollBarPolicy } from '../api-converters/main-layout/response/main-layout-converter';
import { TimeSeriesIdentifier } from './timeseries';

export interface ViewInputParameters {
    viewId: number;
    title: string;
    style: string;
    timeSeries?: Array<TimeSeriesIdentifier>;
}

export interface ViewInputParametersChart extends ViewInputParameters {
    valueAxis?: Array<ChartAxis>;
    visuals?: ChartVisuals
}

export interface ViewInputParametersScrollArea {
    title: string;
    content: ContentPresenter;
    horizontalScrollBar: scrollBarPolicy;
    verticalScrollBar: scrollBarPolicy;
}

export interface ViewInputParametersLayout {
    title: string;
    content: Array<ContentPresenter>;
}

export interface ViewInputParametersGrid extends ViewInputParametersLayout {
    columnCount: number;
    rowCount: number;
}

export interface ViewInputParametersBox extends ViewInputParametersLayout {
    direction: string;
}

export interface ChartVisuals {
    backgroundColor: string;
    seriesZindex: Array<[number, TimeSeriesIdentifier]>;
}
