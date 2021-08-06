import { ContentPresenter } from "src/app/model/layout";
import { TimeSeriesIdentifier } from "src/app/model/timeseries";

export type ContentPresenterWithSeries = ContentPresenter & {timeSeries: Array<TimeSeriesIdentifier>, timeAxis: Array<Date>};

export class DstmSeriesRequestConverter { }