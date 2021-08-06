import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { combineLatest, Observable, Subject, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { TimeSeriesIdentifier, TimeSeriesUtil, TimeSeriesWithData, TimeSeries } from '../model/timeseries';
import fromUnixTime from 'date-fns/fromUnixTime';
import { CellValueChangedEvent, ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { AllModules } from '@ag-grid-enterprise/all-modules';
import { cellFocused, cellsValueChanged, getWithNextSorting } from './table-events';
import { getRowNodeId } from './table-callbacks';
import { changedSeriesForViewOperator, createDataSeries, createTimeSeriesIdentifier, filterOutTemplateSeries, getAddedSeries, getCaseAndScenarioId, getDisplayAttributes, getRemovedSeries, getScalingFactor, getSeriesInView, getUpdateSeries, SeriesUpdate } from '../utils/chart-table-utils';
import { TimeSeriesEntityService } from '../services/time-series-entity/time-series-entity.service';
import { ViewInputParameters } from '../app.component';
import { TableTooltipComponent, TooltipData } from '../table-tooltip/table-tooltip.component';
import { MainLayoutEntityService } from '../services/mainlayout-entity.service';
import { FilterEntityService, FilterSet } from '../services/filter-entity.service';



export interface ColumnTags {
    nameColumnTag: string;
    seriesTypeTag: string;
    caseColumnTag: string;
    scenarioColumnTag: string;
}


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
    tooltipField?: string;
    // customTooltip?: string;
    tooltipComponentParams?: {};
}

@Component({
    selector: 'app-table-data',
    templateUrl: './table-data.component.html',
    styleUrls: ['./table-data.component.scss'],
})
export class TableDataComponent implements OnInit, OnDestroy {

    /*      
        ak 04.03.2021: Motivation, only using ag-grid GridOptions instead of binding in the template since;
                        - some are not exposed to Angular, so have to mix anyway
                        - typing and intellisense is much better in Typescript compared to the template
    */

    
    @Input()
    public set inputParameters(parameters: ViewInputParameters) {
        this.viewId = parameters.viewId;
        this.timeSeries = filterOutTemplateSeries(parameters.timeSeries);
    }
    private viewId: number;
    private timeSeries: Array<TimeSeriesIdentifier>;

    public columnDefs: Array<ColumnDefinition>;
    public gridOptions: GridOptions;
    public modules: any = AllModules;

    // public filterComponentOpen = false;
    public filterData$: Observable<FilterSet>;

    // everything from here should be availalbe, it seems: https://www.ag-grid.com/javascript-grid-api/
    private gridApi: GridApi;
    private columnApi: ColumnApi;

    private columnTags: ColumnTags;
    private rowIndexForTimeSeries: Array<[rowIndex: number, rowId: string, seriesId: TimeSeriesIdentifier]>;

    private subscriptions = new Array<Subscription>();
    private gridReady$ = new Subject<boolean>();        // must wait for the grid to be ready before setting values

    private previousPayloadDates = new Array<[seriesId: TimeSeriesIdentifier, date: number]>();

    private inPasteOperation = false;   // have to buffer the cell value changed events ourselves, https://www.ag-grid.com/javascript-grid/clipboard/
    private pasteBuffer: Array<CellValueChangedEvent>;


    constructor(private mainLayoutEntityService: MainLayoutEntityService,  
                private timeSeriesEntityService: TimeSeriesEntityService,
                private filterEntityService: FilterEntityService) { 

        // in order for this to work property name and valus must match                    
        this.columnTags = {
            nameColumnTag: 'nameColumnTag',
            seriesTypeTag: 'seriesTypeTag',
            caseColumnTag: 'caseColumnTag',
            scenarioColumnTag: 'scenarioColumnTag'
        };
    }

    public ngOnInit() {

        this.gridOptions = this.initGridOptions();
        this.subscriptions.push(this.createTrackSeriesChangedSubscription());

        this.filterData$ = this.filterEntityService.entities$.pipe(
            map(i => i.find(i => i.viewId === this.viewId))
        );
    }

    // when values changes on series included in this table, or when the definitions regarding which series should be included in table changes
    private createTrackSeriesChangedSubscription() {
        
        return combineLatest([this.gridReady$, this.mainLayoutEntityService.entities$, this.timeSeriesEntityService.entities$]).pipe(
            filter(([_, i, series]) => series.length > 0),
            map(([_, i, series]) => {

                const p = [...this.timeSeries];
                const n = getSeriesInView(this.viewId, i[0]);
                this.timeSeries = getSeriesInView(this.viewId, i[0]);

                return {
                    addedSeries: getAddedSeries(p, n),
                    removedSeries: getRemovedSeries(p, n),
                    updatedSeries: getUpdateSeries(p,n),
                    series
                } as SeriesUpdate;

            }),
            changedSeriesForViewOperator(this.viewId, this.previousPayloadDates),
        ).subscribe(({ addedOrUpdated, removed }: { addedOrUpdated: Array<TimeSeriesWithData<number>>, removed: Array<TimeSeriesIdentifier> }) => {

            if (addedOrUpdated.length > 0) {

                if (!this.columnDefs) this.columnDefs = this.createColumnDefs(addedOrUpdated);
                this.addOrUpdateSeries(addedOrUpdated);
            }

            if (removed.length > 0) this.removeSeries(removed)
        });
    }

    public ngOnDestroy() {
        this.subscriptions?.forEach(i => i.unsubscribe());
    }

    private initGridOptions = (): GridOptions => {

        return {
            suppressPropertyNamesCheck: true,
            enableRangeSelection: true,
            onCellFocused: cellFocused,
            getRowNodeId: (i: ColumnTags) => getRowNodeId(i),
            onCellValueChanged: i => this.cellValueChanged(i),
            onSortChanged: i => { this.rowIndexForTimeSeries = getWithNextSorting(i, this.rowIndexForTimeSeries)},
            onPasteStart: _ => { this.pasteStart() },
            onPasteEnd: _ => { this.pasteEnd() },
            onGridReady: ({ api, columnApi }) => {
                this.gridApi = api;
                this.columnApi = columnApi;
                this.gridReady$.next(true);
            },
            tooltipShowDelay: 0,
            frameworkComponents: { customTooltip: TableTooltipComponent },
            defaultColDef: {
                tooltipComponent: 'customTooltip',  // must match the one used above for tooltip
            }
        };
    }

    private cellValueChanged(event: CellValueChangedEvent) {

        if (this.inPasteOperation) {
            this.pasteBuffer.push(event);

        } else {
            cellsValueChanged([event], this.viewId, this.rowIndexForTimeSeries, this.timeSeries, this.timeSeriesEntityService)
        }
    }

    private pasteStart() {
        this.inPasteOperation = true;
        this.pasteBuffer = new Array<CellValueChangedEvent>();
    }

    private pasteEnd() {
        
        this.inPasteOperation = false;
        
        const events = [...this.pasteBuffer];
        this.pasteBuffer = new Array<CellValueChangedEvent>();

        cellsValueChanged(events, this.viewId, this.rowIndexForTimeSeries, this.timeSeries, this.timeSeriesEntityService);
    }

    private createColumnDefs = (series: Array<TimeSeriesWithData<number>>): Array<ColumnDefinition> => {

        const common: {
            editable: boolean;
            sortable: boolean;
            pinned: 'left' | 'right' } = { editable: false, pinned: 'left', sortable: true };


        const nameColumn: ColumnDefinition = {
            headerName: "Name",
            field: this.columnTags.nameColumnTag,
            tooltipField: this.columnTags.nameColumnTag,
            width: 120,
            tooltipComponentParams: { getTimeSeriesAtRow: this.getTimeSeriesAtRow  } as TooltipData,
            ...common,
        };
        const seriesTypeColumn: ColumnDefinition = {
            headerName: "Attribute",
            field: this.columnTags.seriesTypeTag,
            width: 130,
            ...common,
        };
        const caseColumn: ColumnDefinition = {
            headerName: "Run",
            field: this.columnTags.caseColumnTag,
            width: 65,
            ...common,
        };
        const scenarioColumn: ColumnDefinition = {
            headerName: "Scenario",
            field: this.columnTags.scenarioColumnTag,
            width: 90,
            ...common,
        };

        const timeSteps: Array<ColumnDefinition> = Array.from(series[0].data).map(([dateUnix, _]) => {
            return ({
                headerName: this.dateToString(dateUnix),
                field: `${dateUnix}`,
                width: 75,
                date: dateUnix,
                editable: true,
                valueParser: (i) => this.numberParser(i)
            });
        });

        return [nameColumn, seriesTypeColumn, caseColumn, scenarioColumn, ...timeSteps];
    }

    private getTimeSeriesAtRow = (rowIndex: number): TimeSeriesIdentifier => {
        
        const match = this.rowIndexForTimeSeries.find(i => i[0] === rowIndex);
        return match ? match[2] : undefined
    }   

    private addOrUpdateSeries = (timeSeries: Array<TimeSeriesWithData<number>>) => {

        const update = new Array<TimeSeriesWithData<number>>();
        const add = new Array<TimeSeriesWithData<number>>();

        const seriesExists = (i: TimeSeriesIdentifier) => this.rowIndexForTimeSeries?.find(j => TimeSeriesUtil.sameSeries(i, j[2]))

        timeSeries.forEach(i => {

            if (seriesExists(i)) {
                update.push(i)
            } else {
                add.push(i)
            }
        });

        const addIndex = this.rowIndexForTimeSeries?.length ?? 0;

        this.gridApi.applyTransaction({
            update: update.length > 0 ? this.createRowData(update, false) : [],
            add: add.length > 0 ? this.createRowData(add, true) : [],
            addIndex: addIndex,
        });
    }

    private removeSeries = (removedSeries: Array<TimeSeriesIdentifier>) => {

        if (removedSeries.length > 0) {

            const remove = removedSeries.map(i => {

                const { objectName: nameColumnTag, seriesType: seriesTypeTag } = i?.displayAttributes ?? {};
                const { caseId: caseColumnTag, scenarioId: scenarioColumnTag } = getCaseAndScenarioId(i);

                return { nameColumnTag, seriesTypeTag, caseColumnTag, scenarioColumnTag };

            }).filter(i => !!i);
            
            if (remove.length > 0) this.gridApi.applyTransaction({ remove });

            this.removeFromRowIndexForTimeSeries(removedSeries);
            this.removeFromPayloadDates(removedSeries);
        }
    }

    private createRowData = (series: Array<TimeSeriesWithData<number>>, updateRowIndex: boolean): Array<RowData> => {

        // ag-grid does not seem to have any good row api, must keep a reference to which time series is displayed in each row
        if (updateRowIndex) {
            this.rowIndexForTimeSeries = this.rowIndexForTimeSeries ?? [];
            const startIndex = this.rowIndexForTimeSeries.length;

            series.map((i, index) => { 
                this.rowIndexForTimeSeries.push([startIndex + index, this.createTableRowId(i), createTimeSeriesIdentifier(i, this.timeSeries)])
            });
        }

        // TOOD; for now the order requested by the user is not taken into account. 
        return series.map(s => this.createRowDataForSeries(s));
    }

    private createRowDataForSeries = (series: TimeSeriesWithData<number>) => {
        
        const scalingFactor = getScalingFactor({identifier: series}, this.timeSeries) ?? 1;
        const rowData: RowData = {};
        const [nameTag, seriesTypeTag, caseTag, scenarioTag] = this.createTableRowTags(series);

        rowData[this.columnTags.nameColumnTag] = nameTag;
        rowData[this.columnTags.seriesTypeTag] = seriesTypeTag;
        rowData[this.columnTags.caseColumnTag] = caseTag;
        rowData[this.columnTags.scenarioColumnTag] = scenarioTag;

        createDataSeries(series, false, scalingFactor).forEach(([d, v]) => { rowData[`${d}`] = this.convertCellValue(v); });

        return rowData;
    }

    // this is how ag-grid creates its internal id for a specific column
    private createTableRowId(series: TimeSeriesWithData<number>): string {
        const [nameTag, seriesTypeTag, caseTag, scenarioTag] = this.createTableRowTags(series);
        return `${nameTag}-${seriesTypeTag}-${caseTag}-${scenarioTag}`;
    }

    private createTableRowTags(series: TimeSeries): [string, string, string, string] {

        const { displayName, objectName, seriesType } = getDisplayAttributes(series, this.timeSeries);
        const { caseId, scenarioId } = getCaseAndScenarioId(series);

        const nameTag = objectName ?? displayName;
        const seriesTypeTag = seriesType;
        const caseTag = caseId;
        const scenarioTag = scenarioId;

        return [nameTag, seriesTypeTag, caseTag, scenarioTag];
    }

    private removeFromRowIndexForTimeSeries = (removed: Array<TimeSeriesIdentifier>) => {
        
        const findIndex = (i: TimeSeriesIdentifier) => this.rowIndexForTimeSeries.findIndex(j => TimeSeriesUtil.sameSeries(i, j[2]));
        this.removeFromList(removed, this.rowIndexForTimeSeries, findIndex);
    }

    private removeFromPayloadDates = (removed: Array<TimeSeriesIdentifier>) => {
        
        const findIndex = (i: TimeSeriesIdentifier) => this.previousPayloadDates.findIndex(j => TimeSeriesUtil.sameSeries(i, j[0]));
        this.removeFromList(removed, this.previousPayloadDates, findIndex);
    }

    private removeFromList = (removed: Array<TimeSeriesIdentifier>, list: Array<any>, findIndex: (i: TimeSeriesIdentifier) => number) => {
        
        removed.forEach(i => {
            const index = findIndex(i);
            if (index >= 0) list.splice(index, 1);
        });
    }

    // ag grid does not seem to handle the value zero properly(!), it will not show up in grid, but it will be there
    // if pressing F2 in a cell, strange... Have to convert zero to a string in order for it to be visualized
    private convertCellValue = (value: any): number | string => {

        if (value === null || value === undefined) return undefined;

        const v = Number(value);

        return !Number.isNaN(v)
            ? v !== 0 ? v : '0'  // try 0 and see it break
            : undefined;
    }

    private numberParser = (data: { newValue: string }) => this.convertCellValue(data?.newValue);

    private dateToString(unixTime: number) {
        const date = fromUnixTime(unixTime);
        const hour = date.getHours();
        const convert = (t: number) => t < 10 ? `0${t}` : `${t}`;

        return hour === 0 ? `${convert(date.getDate())}-${convert(date.getMonth() + 1)}` : `${hour}:00`;
    }
}


