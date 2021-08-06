
import { ColumnTags } from './table-read-only.component';


export const getRowNodeId = (data: ColumnTags): string => {

    const { nameColumnTag = undefined, seriesTypeTag = undefined, caseColumnTag = '', scenarioColumnTag = '' } = data ?? {};

    return nameColumnTag && seriesTypeTag
           ? `${nameColumnTag}-${seriesTypeTag}-${caseColumnTag}-${scenarioColumnTag}`
           : undefined;
}; 
