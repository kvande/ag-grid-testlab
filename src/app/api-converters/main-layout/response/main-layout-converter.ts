import { Position } from "src/app/model/layout";
import { TimeSeriesIdentifier } from "src/app/model/timeseries";


export type mainPresenters =  'table' | 'chart' | 'multicontent' | 'box' | 'grid' | 'scrollArea';
export type scrollBarPolicy = 'never' | 'always' | 'auto'; // TODO: correct this if necessary

export interface ChartAxis {
  title: string;
  min?: number;
  max?: number;
  tickCount?: number;
  alignment: 'left' | 'right';
  series?: Array<TimeSeriesIdentifier & {groupId: number | undefined}>;
  axisVisible?: boolean;
}

export interface ContentPresenter {
  id: number;
  presenter: mainPresenters;
  title?: string;              // not sure it this is needed, but 'nice to have' for now
  style?: string;              // for now just a simple string, create an object later, or should class be used instead (probably not a good idea)
  position: Position;
}
