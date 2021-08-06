
import { CellFocusedEvent, CellValueChangedEvent, GridOptions } from 'ag-grid-community';
import { TimeSeriesEntityService } from '../services/timeseries-entity.service';
import { ComponentType, TimeSeriesIdentifier, TimeSeriesUtil, ViewWithTimeSeries } from '../time-series';

export const cellFocused = (event: CellFocusedEvent) => {

    console.log('*** cellFocused ***');
    console.log(event.rowIndex);
    
}

export const cellValueChanged = (event: CellValueChangedEvent, 
                                 viewId: number,
                                 rowIndexForTimeSeries: Array<[number, TimeSeriesIdentifier]>,
                                 timeSeriesEntityService: TimeSeriesEntityService) => {

    if (event.newValue === event.oldValue) return;    // might happen if just tabbing in and out of cells
    
    console.log('New value:', event.newValue, ' || old value:', event.oldValue);
    
    const match = rowIndexForTimeSeries.find(i => i[0] === event.rowIndex);
    const { modelKey = '', hpsId = 0, componentId = 0, componentType = ComponentType.undefined, attributeId = '' } = match ? match[1] : { };

    if (hpsId === 0) return;

    const change: ViewWithTimeSeries = {
        viewId,
        timeSeries: [
                {
                    id: TimeSeriesUtil.createId(hpsId, componentId, componentType, attributeId),
                    modelKey,
                    hpsId,
                    componentId,
                    componentType,
                    attributeId,
                    data: [[(event.colDef as any).date, event.newValue]],
                    payloadDate: Date.now()
                }
        ]
    };

    timeSeriesEntityService.update(change);
}