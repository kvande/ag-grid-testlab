import { Component, Input, OnInit } from '@angular/core';
import { Observable, of, Subscription } from 'rxjs';
import { filter  } from 'rxjs/operators';
import { TimeSeries, TimeSeriesIdentifier, TimeSeriesWithData, ViewWithTimeSeries } from '../time-series';
import fromUnixTime from 'date-fns/fromUnixTime';
import './table-data';
import { tableData$ } from './table-data';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { cellFocused } from './table-events';



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

    /*      
        ak 04.03.2021: Motivation, only using ag-grid GridOptions instead of binding in the template since,
                        - some are not exposed to Angular, so have to mix anyway
                        - typing and intellisense is much better in Typescript compared to the template
    */ 

    @Input()
    public inputParameters: ViewInputParameters;

    
    public columnDefs: Array<ColumnDefinition>;

    public gridOptions: GridOptions;
    
        // everything from here should be availalbe, it seems: https://www.ag-grid.com/javascript-grid-api/
    private agGridApi: GridApi; 
    private columnApi: ColumnApi;


    public rowData: Array<RowData>;
    private firstColumnTag = 'series-name';
    private rowIndexForTimeSeries: Array<[number, TimeSeriesIdentifier]>;

    private subscription: Subscription;


    constructor() {
        this.gridOptions = this.initGridOptions();
    }

    public ngOnInit() {

        this.subscription = this.data$().pipe(
            filter((i: []) => i.length > 0),
        ).subscribe((timeSeries: Array<TimeSeriesWithData<number>>) => {


                // console.log('here');


                // todo, just a naive approach regarding adding series. A better way should be established later
                if (!this.columnDefs) this.columnDefs = this.createColumnDefs(timeSeries);
                this.rowData = this.createRowData(timeSeries);

                // console.log(this.rowData)
            });

    }

    public data$ = (): Observable<Array<TimeSeriesWithData<number>>> => tableData$();

    public ngOnDestroy() {
        this.subscription?.unsubscribe();
    }

    private initGridOptions = (): GridOptions => {

        return {
            suppressPropertyNamesCheck: true,
            onCellFocused: cellFocused,
            onGridReady: ({api, columnApi}) => {
                this.agGridApi = api;
                this.columnApi = columnApi;
            }
        };

        // {
        //     suppressPropertyNamesCheck: true,
        //     onCellValueChanged: () => {
        //         console.log('it was changed');
                
        //     },
        //     getRowNodeId: (i: any) => {
        //         console.log('here er vi');
                
        //         return 'ping';
        //     }
    }




    public onGridReady = (params: any) => {
        this.agGridApi = params.api;
        // this.agGridColumnApi = params.columnApi;  // will this be needed at some stage? Keep it here as a reminder for later use
    }

    public cellGotFocusCallback = (event: any) => {
        if (event && event.column) {
            // console.log('Row is ', event.rowIndex, ' -- col is ', event.column.colId);
        }
    }

    public getRowNodeIdCallback(event: any) {
        console.log('*******************************', event);

        return 123456789;
        
    }


    public cellValueChanged(event: { rowIndex: number, oldValue: number, newValue: number, colDef: ColumnDefinition, data: any }) {

        console.log('*** cellValueChanged ***');
        

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
                width: 70,
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

        rowData[this.firstColumnTag] = series.attributeId;
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
}
