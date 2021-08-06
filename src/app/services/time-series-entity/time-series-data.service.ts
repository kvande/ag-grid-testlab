import { TimeSeriesWithData } from "src/app/model/timeseries";


export interface ViewWithTimeSeries {
    viewId: number;
    requestId?: string;
    timeSeries: Array<TimeSeriesWithData<number>>;
}

