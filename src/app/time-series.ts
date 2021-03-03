

export enum ComponentType {
    undefined,
    powerPlant,
    unit,
    reservoir,
    waterway,
    market
}

export interface TimeSeriesLocation {
    host?: string;
    port?: number;
}

export interface TimeSeriesIdentifier extends TimeSeriesLocation {
    modelKey?: string | undefined;
    hpsId: number | undefined;
    componentId: number | undefined;
    componentType: ComponentType;
    attributeId: string | undefined;
    displayName?: string;
}

export interface TimeSeries extends TimeSeriesIdentifier {
    id: number | string;
}

export interface TimeSeriesWithData<T> extends TimeSeries {
    data: Array<[number, T]>;
    pfx?: boolean;
    payloadDate: number;
}

export interface ViewWithTimeSeries {
    viewId: number;
    requestId?: string;
    timeSeries: Array<TimeSeriesWithData<number>>;
}

