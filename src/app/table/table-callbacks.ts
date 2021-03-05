
import { GridOptions } from 'ag-grid-community';

// data is not types in ag-grid
export const getRowNodeId = (data: any, colId: string): string => data[colId];