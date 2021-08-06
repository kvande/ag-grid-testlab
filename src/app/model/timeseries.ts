import { id } from "date-fns/locale";


export enum TimeSeriesSource {
    undefined,
    dstm,
    dtss
}

export namespace TimeSeriesSource {
    
    export function fromString(text: string): TimeSeriesSource {
        switch (text?.toLowerCase() ?? '') {
            case 'dstm':
                return TimeSeriesSource.dstm;
            case 'dtss':
                return TimeSeriesSource.dtss;
            default:
                return TimeSeriesSource.undefined;
        }
    }

    export function toString(source: TimeSeriesSource): string {
        switch (source) {
            case TimeSeriesSource.dstm:
                return 'dstm';
            case TimeSeriesSource.dtss:
                return 'dtss';
            default:
                return '';
        }
    }
}


export enum ComponentType {
    undefined,
    powerPlant,
    unit,
    reservoir,
    waterway,
    market,
    gate
}

export namespace ComponentType {

    export function fromString(text: string): ComponentType {
        switch (text?.toUpperCase() ?? '') {
            case 'P':
                return ComponentType.powerPlant;
            case 'U':
                return ComponentType.unit;
            case 'R':
                return ComponentType.reservoir;
            case 'W':
                return ComponentType.waterway;
            case 'M':
                return ComponentType.market;
            case 'G':
                return ComponentType.gate;
            default:
                return ComponentType.undefined;
        }
    }

    // these should match the ones used in the api (none plural form); https://gitlab.com/shyft-os/shyft/-/wikis/Reference-for-DStm-Web-API.
    export function toString(componentType: ComponentType): string {
        switch (componentType) {
            case ComponentType.powerPlant:
                return 'power_plant';
            case ComponentType.unit:
                return 'unit';
            case ComponentType.reservoir:
                return 'reservoir';
            case ComponentType.waterway:
                return 'waterway';
            case ComponentType.gate:
                return 'gate';
            case ComponentType.market:
                return 'market';
            default:
                return '';      // this is not complete (add when api requests are known)
        }
    }
}

export interface TimeSeriesLocation {
    host?: string;
    port?: number;
}

// normaly a modelIdentifier 'or' an urlIdentifier is used to identify a time series
// it might also have a templated identifier, that will reveal its identity based on external factors (like active scenario(s) and/or run(s))
export interface TimeSeriesIdentifier extends TimeSeriesLocation {
    
    modelIdentifier?: TimeSeriesModelIdentifier & { caseId?: string, scenarioId?: string },
    urlIdentifier?: TimeSeriesUrlIdentifier & { caseId?: string, scenarioId?: string },

    modelTemplateIdentifier?: TimeSeriesModelIdentifier & { taskTemplated: boolean, caseTemplated: boolean; scenarioTemplated: boolean; },
    urlTemplateIdentifier?: TimeSeriesUrlIdentifier &  { taskTemplated: boolean, caseTemplated: boolean; scenarioTemplated: boolean; }

    displayAttributes?: TimeSeriesDisplayAttributes;
    source?: TimeSeriesSource;
}

export interface TimeSeriesDisplayAttributes {
    displayName: string;
    objectName?: string;
    seriesType?: string;
    tags?: Array<string>;
}

export interface TimeSeriesModelIdentifier {
    modelKey: string | undefined;
    hpsId: number | undefined;
    componentId: number | undefined;
    componentType: ComponentType
    attributeId: string | undefined;
    marketId?: number | undefined;
}

export interface TimeSeriesUrlIdentifier {
    url: string;
}

export interface TimeSeriesVisualization {
    fillColor?: string;
    strokeColor?: string;
    barWidth?: number;
    lineWidth?: number;
    style?: 'solid' | 'dot' | 'dash';
    type?: 'line' | 'bar' | 'stackedbar';
    decimals?: number;
    scalingFactor?: number;
    readOnly?: boolean;
    initialVisible?: boolean;       // states if series should be visible when table/chart component is initial loaded
}

export interface TimeSeries extends TimeSeriesIdentifier {
    id: number | string;
}

export interface TimeSeriesWithData<T> extends TimeSeries {
    data: Array<[number, T]>;
    pfx?: boolean;
    payloadDate: number;
}


export class TimeSeriesUtil {


    public static createIdFromTimeSeriesIdentifier(identifier: TimeSeriesIdentifier) {
        
        const { modelIdentifier, urlIdentifier } = identifier ?? {};
        const { hpsId = 0, marketId = 0, componentId, componentType, attributeId, } = modelIdentifier ?? {};


        return hpsId > 0 ? TimeSeriesUtil.createIdForHps(hpsId, componentId, componentType, attributeId)
                : marketId > 0 ? TimeSeriesUtil.createIdForMarket(marketId, componentType, attributeId)
                : urlIdentifier ? this.createIdForUrl(urlIdentifier?.url)
                : '';
    }

    public static createIdForHps(hpsId: number, componentId: number, componentType: ComponentType, attributeId: string): string {

        return hpsId > 0 && componentId > 0 && componentType !== ComponentType.undefined && attributeId
                ? `hpsId:${hpsId}::componentId:${componentId}::componentType:${componentType}::attributeId:${attributeId}`
                : '';
    }

    public static createIdForMarket(marketId: number, componentType: ComponentType, attributeId: string): string {

        return marketId > 0 && componentType !== ComponentType.undefined && attributeId
                ? `market::componentId:${marketId}::componentType:${componentType}::attributeId:${attributeId}`
                : '';
    }

    public static createIdForUrl = (url: string) => (url?.length ?? 0) > 0 ? url : '';

    public static sameSeries(seriesOne: TimeSeriesIdentifier, seriesTwo: TimeSeriesIdentifier) {
        
        const [hpsSeries, marketSeries, urlIdSeries] = [seriesOne?.modelIdentifier?.hpsId && seriesTwo?.modelIdentifier?.hpsId,
                                                        seriesOne?.modelIdentifier?.marketId && seriesTwo?.modelIdentifier?.marketId,
                                                        seriesOne?.urlIdentifier && seriesTwo?.urlIdentifier];

        return hpsSeries ? this.sameModelSeries(seriesOne, seriesTwo, TimeSeriesUtil.getModelSeries) && this.sameCaseAndScenario(seriesOne, seriesTwo)
                : marketSeries ? this.sameMarketSeries(seriesOne, seriesTwo, TimeSeriesUtil.getModelSeries) && this.sameCaseAndScenario(seriesOne, seriesTwo)
                : urlIdSeries ? this.sameUrlSeries(seriesOne, seriesTwo)
                : false;
    }

    public static sameTemplateSeries(seriesOne: TimeSeriesIdentifier, seriesTwo: TimeSeriesIdentifier) {
        
        const [hpsSeries, marketSeries, urlIdSeries] = [seriesOne?.modelTemplateIdentifier?.hpsId && seriesTwo?.modelTemplateIdentifier?.hpsId,
                                                        seriesOne?.modelTemplateIdentifier?.marketId && seriesTwo?.modelTemplateIdentifier?.marketId,
                                                        seriesOne?.urlTemplateIdentifier && seriesTwo?.urlTemplateIdentifier];

        return hpsSeries ? this.sameModelSeries(seriesOne, seriesTwo, TimeSeriesUtil.getModelTemplateSeries) 
                : marketSeries ? this.sameMarketSeries(seriesOne, seriesTwo, TimeSeriesUtil.getModelTemplateSeries)
                : urlIdSeries ? this.sameUrlSeries(seriesOne, seriesTwo, true)
                : false;
    }


    private static sameModelSeries(seriesOne: TimeSeriesIdentifier, seriesTwo: TimeSeriesIdentifier, 
                                    getModelSeries: (a: TimeSeriesIdentifier, b: TimeSeriesIdentifier) => [TimeSeriesModelIdentifier, TimeSeriesModelIdentifier] ) {

        const [a, b] = getModelSeries(seriesOne, seriesTwo);
        
        return a && b &&
               (a.componentType === ComponentType.market && b.componentType === ComponentType.market)
                ? TimeSeriesUtil.sameMarketSeries(seriesOne, seriesTwo, getModelSeries)
                : a.hpsId === b.hpsId &&
                  a.componentId === b.componentId &&
                  a.componentType === b.componentType &&
                  a.attributeId === b.attributeId;
    }
    
    private static sameCaseAndScenario = (seriesOne: TimeSeriesIdentifier, seriesTwo: TimeSeriesIdentifier) => {
        
        const missing = Number.MIN_VALUE;

        // missing should equal that 'same is true'
        const caseIdSeriesOne = seriesOne?.modelIdentifier?.caseId ?? missing;
        const caseIdSeriesTwo = seriesTwo?.modelIdentifier?.caseId ?? missing;
        const scenarioIdSeriesOne = seriesOne?.modelIdentifier?.scenarioId ?? missing;
        const scenarioIdSeriesTwo = seriesTwo?.modelIdentifier?.scenarioId ?? missing;

        return caseIdSeriesOne === caseIdSeriesTwo && scenarioIdSeriesOne === scenarioIdSeriesTwo;
    }

    // in case of market use a simpler test, since the market has no real market id
    private static sameMarketSeries(seriesOne: TimeSeriesIdentifier, seriesTwo: TimeSeriesIdentifier,
                                    getModelSeries: (a: TimeSeriesIdentifier, b: TimeSeriesIdentifier) => [TimeSeriesModelIdentifier, TimeSeriesModelIdentifier]) {
        
        const [a, b] = getModelSeries(seriesOne, seriesTwo);

        return a && b &&
               a.componentId === b.componentId &&
               a.componentType === b.componentType &&
               a.attributeId === b.attributeId;
    }

    private static sameUrlSeries(seriesOne: TimeSeriesIdentifier, seriesTwo: TimeSeriesIdentifier, useTemplateSeries: boolean = false ) {

        const [a, b] = useTemplateSeries
                       ? [seriesOne?.urlTemplateIdentifier?.url, seriesTwo?.urlTemplateIdentifier?.url]
                       : [seriesOne?.urlIdentifier?.url, seriesTwo?.urlIdentifier?.url];

        return a && b && a === b;
    }

    private static getModelSeries(seriesOne: TimeSeriesIdentifier, seriesTwo: TimeSeriesIdentifier): [TimeSeriesModelIdentifier, TimeSeriesModelIdentifier] {
        return (seriesOne?.modelIdentifier && seriesTwo?.modelIdentifier) 
                ? [seriesOne.modelIdentifier, seriesTwo.modelIdentifier]
                : [undefined, undefined]
    }

    private static getModelTemplateSeries(seriesOne: TimeSeriesIdentifier, seriesTwo: TimeSeriesIdentifier): [TimeSeriesModelIdentifier, TimeSeriesModelIdentifier] {
        return (seriesOne?.modelTemplateIdentifier && seriesTwo?.modelTemplateIdentifier) 
                ? [seriesOne.modelTemplateIdentifier, seriesTwo.modelTemplateIdentifier]
                : [undefined, undefined]
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

        return copy;
    }

    public static isTemplateSeries = (series: TimeSeriesIdentifier) => series?.modelTemplateIdentifier || series?.urlTemplateIdentifier;

}

