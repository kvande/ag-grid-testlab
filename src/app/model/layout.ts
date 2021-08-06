
export interface MainLayout {
    id: number;
    name: string;
    content: Array<ContentPresenter>;

    // the last date when data was recived from the api. Used internaly to differentiate when
    // the ngrx store was updated by internal processes and external data from the api
    payloadDate: number;
}

export interface ContentPresenter {
    id: number;
    presenter: mainPresenters;
    title?: string;              // not sure it this is needed, but 'nice to have' for now
    style?: string;              // for now just a simple string, create an object later, or should class be used instead (probably not a good idea)
    position: Position;
}


export interface Position {
    rowStart: number;
    rowEnd: number;
    columnStart: number;
    columnEnd: number;
  }

export type mainPresenters =  'table' | 'chart' | 'multicontent' | 'box' | 'grid' | 'scrollArea';

export class MainLayoutUtils {

    public static findFirstFromLayout = (layout: MainLayout, match: (i: ContentPresenter) => boolean): ContentPresenter => {
        return layout.content[0];
    }
}
