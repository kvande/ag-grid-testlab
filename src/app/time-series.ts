
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


export class TimeSeriesUtil {

    public static createIdFromTimeSeriesIdentifier(identifier: TimeSeriesIdentifier) {
        const { hpsId, componentId, componentType, attributeId } = identifier ?? {};
        return TimeSeriesUtil.createId(hpsId, componentId, componentType, attributeId);
    }

    public static createId(hpsId: number, componentId: number, componentType: ComponentType, attributeId: string): string {

        return hpsId > 0  && componentId > 0 && componentType !== ComponentType.undefined && attributeId
                ? `hpsId:${hpsId}::componentId:${componentId}::componentType:${componentType}::attributeId:${attributeId}`
                : '';
    }

    public static sameSeries(a: TimeSeriesIdentifier, b: TimeSeriesIdentifier) {

        return a && b &&
               a.hpsId === b.hpsId &&
               a.componentId === b.componentId &&
               a.componentType === b.componentType &&
               a.attributeId === b.attributeId;
    }

    // will only merge common time steps, and return a deep copy
    public static mergeTimeAxis<T>(from: Array<[number, T]>, to: Array<[number, T]>): Array<[number, T]> {

        const copy = Array<[number, T]>();
        to?.forEach(([t, v]) => { copy.push([t, v]); });

        if ((from?.length ?? 0) === 0 || (copy?.length ?? 0) === 0) return copy;

        for (const i of from) {
            const timeStep = i[0];
            const index = copy.findIndex(([t, _]) => t === timeStep);

            if (index >= 0) copy[index][1] = i[1];
        }


        // for (let i = 0; i < from.length; i++) {
        //     const timeStep = from[i][0];
        //     const index = copy.findIndex(([t, _]) => t === timeStep);

        //     if (index >= 0) copy[index][1] = from[i][1];
        // }

        return copy;
    }

}

