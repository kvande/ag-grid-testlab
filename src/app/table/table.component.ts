import { Component, Input, OnInit } from '@angular/core';
import { Observable, of, Subscription } from 'rxjs';
import { filter  } from 'rxjs/operators';
import { TimeSeries, TimeSeriesIdentifier, TimeSeriesWithData, ViewWithTimeSeries } from '../time-series';
import fromUnixTime from 'date-fns/fromUnixTime';
import './table-data';
import { tableData$ } from './table-data';

interface RowData {
    [key: string]: string | number;
}

// pick from here: https://www.ag-grid.com/javascript-grid-column-properties/
interface ColumnDefinition {
    headerName: string;
    field: string;      // ag grid use this internal when creating the grid data object, for now use unix date from colomn 1 and onwards for easier look ups later
    width?: number;
    editable: boolean;
    date?: number;       // unix date
    valueParser?: (i: any) => any;
    pinned?: 'left' | 'right';
}

interface ViewInputParameters {
    viewId: number;
    title: string;
    style: string;
    timeSeries?: Array<TimeSeriesIdentifier>;
}


@Component({
    selector: 'app-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit {


    @Input()
    public inputParameters: ViewInputParameters;

    
    public columnDefs: Array<ColumnDefinition>;

    public gridOptions: any;
    private agGridApi: any;     // everything from here should be availalbe, it seems: https://www.ag-grid.com/javascript-grid-api/

    public rowData: Array<RowData>;                // TODO: make observable
    private firstColumnTag = 'series-name';
    private rowIndexForTimeSeries: Array<[number, TimeSeriesIdentifier]>;

    private subscription: Subscription;

    private myData$;

    // constructor() { }

    public ngOnInit() {

        this.subscription = this.data$().pipe(
            filter((i: []) => i.length > 0),
        ).subscribe((timeSeries: Array<TimeSeriesWithData<number>>) => {


                console.log('here');


                // todo, just a naive approach regarding adding series. A better way should be established later
                if (!this.columnDefs) this.columnDefs = this.createColumnDefs(timeSeries);
                this.rowData = this.createRowData(timeSeries);
            });

    }

    public data$ = (): Observable<Array<ViewWithTimeSeries>> => tableData$();

    public ngOnDestroy() {
        this.subscription?.unsubscribe();
    }

    public onGridReady = (params: any) => {
        this.agGridApi = params.api;
        // this.agGridColumnApi = params.columnApi;  // will this be needed at some stage? Keep it here as a reminder for later use
    }

    public cellGotFocus = (event: any) => {
        if (event && event.column) {
            // console.log('Row is ', event.rowIndex, ' -- col is ', event.column.colId);
        }
    }

    public cellValueChanged(event: { rowIndex: number, oldValue: number, newValue: number, colDef: ColumnDefinition, data: any }) {

        if (event.newValue === event.oldValue) return;    // might happen if just tabbing in and out of cells


        // // console.log('New value:', event.newValue, ' || old value:', event.oldValue);


        // const match = this.rowIndexForTimeSeries.find(i => i[0] === event.rowIndex);
        // const { modelKey = '', hpsId = 0, componentId = 0, componentType = ComponentType.undefined, attributeId = '' } = match ? match[1] : { };

        // if (hpsId === 0) return;

        // const change: ViewWithTimeSeries = {
        //     viewId: this.inputParameters.viewId,
        //     timeSeries: [
        //             {
        //                 id: TimeSeriesUtil.createId(hpsId, componentId, componentType, attributeId),
        //                 modelKey,
        //                 hpsId,
        //                 componentId,
        //                 componentType,
        //                 attributeId,
        //                 data: [[event.colDef.date, event.newValue]],
        //                 payloadDate: Date.now()
        //             }
        //     ]
        // };

        // this.timeSeriesEntityService.update(change);
    }


    private createColumnDefs = (series: Array<TimeSeriesWithData<number>>): Array<ColumnDefinition> => {

        const firstColumn: ColumnDefinition = {
            headerName: 'Series name',
            field: this.firstColumnTag,
            // width: 150,
            editable: false,
            pinned: 'left',
        };

        const timeSteps: Array<ColumnDefinition> = Array.from(series[0].data).map(([dateUnix, _]) => {
            return ({
                headerName: this.dateToString(dateUnix),
                field: `${dateUnix}`,
                width: 60,
                date: dateUnix,
                editable: true,
                valueParser: this.numberParser
            });
        });

        return [firstColumn, ...timeSteps];
    }

    private createRowData = (series: Array<TimeSeriesWithData<number>>): Array<RowData> => {

        // ag-grid does not seem to have any good row api, must keep a reference to which time series is displayed in each row
        this.rowIndexForTimeSeries = this.rowIndexForTimeSeries ?? [];
        const startIndex = this.rowIndexForTimeSeries.length;

        series.map((i, index) => { this.rowIndexForTimeSeries.push([startIndex + index, i]) });

        // TOOD; for now the order requested by the user is not taken into account. 
        return [...this.rowData ?? [], ...series.map(s => this.createRowDataForSeries(s))]   ;
    }

    private createRowDataForSeries = (series: TimeSeriesWithData<number>) => {
        const rowData: RowData = {};

        rowData[this.firstColumnTag] = this.getDisplayName(this.inputParameters.timeSeries, series);

        series.data.forEach(([d, v]) => { rowData[`${d}`] = v; });
        return rowData;
    }

    private numberParser(data: {newValue: string}) {
        return data.newValue?.length > 0 ? Number(data.newValue) : undefined;
    }

    private dateToString(unixTime: number) {
        const date = fromUnixTime(unixTime);
        const hour = date.getHours();
        const convert = (t: number) => t < 10 ? `0${t}` : `${t}`;

        return hour === 0 ? `${convert(date.getDate())}-${convert(date.getMonth() + 1)}` : `${hour}:00`;
    }
    

    private getDisplayName(all: Array<TimeSeriesIdentifier>, series: TimeSeries): string {

        return 'jalla'
        
        // const match = all?.find(i => TimeSeriesUtil.sameSeries(i, series));
        // return match?.displayName ?? (series?.id?.toString() ?? '');
    }

}
