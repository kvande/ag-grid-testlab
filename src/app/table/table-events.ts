
import { CellFocusedEvent, GridOptions } from 'ag-grid-community';

export const cellFocused = (event: CellFocusedEvent) => {

    console.log('*** cellValueChanged ***');
    console.log(event.rowIndex);
    
}