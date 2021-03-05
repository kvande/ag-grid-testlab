import { Component, Input, OnInit } from '@angular/core';
import {  combineLatest, Subject, Subscription } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { TimeSeriesIdentifier, TimeSeriesUtil, TimeSeriesWithData, ComponentType, ViewWithTimeSeries } from '../time-series';
import fromUnixTime from 'date-fns/fromUnixTime';
import { CellValueChangedEvent, ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { cellFocused, cellValueChanged } from './table-events';
import { getRowNodeId } from './table-callbacks';
import { changedSeriesForView, createTimeSeriesIdentifier, getDisplayName } from '../utils/chart-table-utils';
import { TimeSeriesEntityService } from '../services/timeseries-entity.service';
import { ViewInputParameters } from '../app.component';


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

@Component({
    selector: 'app-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss'],
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
    private gridApi: GridApi; 
    private columnApi: ColumnApi;

    private firstColumnTag = 'SeriesName';
    private rowIndexForTimeSeries: Array<[number, TimeSeriesIdentifier]>;

    private subscription: Subscription;
    private gridReady$ = new Subject<boolean>();        // must wait for the grid to be ready before setting values

    private previousPayloadDates = new Array<[TimeSeriesIdentifier, number]>();
    

    constructor(private timeSeriesEntityService: TimeSeriesEntityService) {}

    public ngOnInit() {

        this.gridOptions = this.initGridOptions();

        this.subscription = combineLatest([this.gridReady$, this.timeSeriesEntityService.entities$]).pipe(
            map(([_, j]) => j),
            filter((i: []) => i.length > 0),
            changedSeriesForView(this.inputParameters.viewId, this.previousPayloadDates),
            filter((i: []) => i.length > 0),
        ).subscribe((timeSeries: Array<TimeSeriesWithData<number>>) => {

            if (!this.columnDefs) this.columnDefs = this.createColumnDefs(timeSeries);
            this.addWithTransaction(timeSeries);
        });
    }

    public ngOnDestroy() {
        this.subscription?.unsubscribe();
    }

    private initGridOptions = (): GridOptions => {

        return {
            suppressPropertyNamesCheck: true,
            onCellFocused: cellFocused,
            getRowNodeId: i => getRowNodeId(i, this.firstColumnTag),
            onCellValueChanged: i => this.cellValueChanged(i),
            onGridReady: ({api, columnApi}) => {
                this.gridApi = api;
                this.columnApi = columnApi;
                this.gridReady$.next(true);
            }
        };
    }
    
    public cellValueChanged(event: CellValueChangedEvent) {
        cellValueChanged(event, this.inputParameters.viewId, this.rowIndexForTimeSeries, this.timeSeriesEntityService)
    }

    private createColumnDefs = (series: Array<TimeSeriesWithData<number>>): Array<ColumnDefinition> => {

        const firstColumn: ColumnDefinition = {
            headerName: 'Series name',
            field: this.firstColumnTag,
            // width: 150,
            editable: false,
            pinned: 'left',
        };

        console.log(series);
        

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

    private addWithTransaction = (timeSeries: Array<TimeSeriesWithData<number>>) => {

        const update = new Array<TimeSeriesWithData<number>>();
        const add = new Array<TimeSeriesWithData<number>>();
        
        const seriesExists = (i: TimeSeriesIdentifier) => this.rowIndexForTimeSeries?.find(j => TimeSeriesUtil.sameSeries(i, j[1]))
        
        timeSeries.forEach(i => {

            if (seriesExists(i)) {
                update.push(i)
            } else {
                add.push(i)
            }
        });

        const addIndex = this.rowIndexForTimeSeries?.length ?? 0;

        var res = this.gridApi.applyTransaction({
            update: update.length > 0 ? this.createRowData(update, false) : [],
            add: add.length > 0 ? this.createRowData(add, true) : [],
            addIndex: addIndex,
        });

        // console.log(res);    
    }

    private createRowData = (series: Array<TimeSeriesWithData<number>>, updateRowIndex: boolean): Array<RowData> => {
        
        // ag-grid does not seem to have any good row api, must keep a reference to which time series is displayed in each row
        if (updateRowIndex) {
            this.rowIndexForTimeSeries = this.rowIndexForTimeSeries ?? [];
            const startIndex = this.rowIndexForTimeSeries.length;
    
            series.map((i, index) => { this.rowIndexForTimeSeries.push([startIndex + index, createTimeSeriesIdentifier(i)]) });
        }

        // TOOD; for now the order requested by the user is not taken into account. 
        return series.map(s => this.createRowDataForSeries(s));
    }

    private createRowDataForSeries = (series: TimeSeriesWithData<number>) => {
        const rowData: RowData = {};

        rowData[this.firstColumnTag] = getDisplayName(this.inputParameters.timeSeries, series);
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
