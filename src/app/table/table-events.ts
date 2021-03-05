
import { CellFocusedEvent, GridOptions } from 'ag-grid-community';

export const cellFocused = (event: CellFocusedEvent) => {

    console.log('*** cellFocused ***');
    console.log(event.rowIndex);
    
}