

## How to update from 'source'

It should be possible to copy the content of this files directly:

..?/../table-callbacks.ts
..?/../table-events.ts

..?/utils/chart-table-utils

and the ....component.ts files, but not the imports in the top of it, but these will have to be updated afterwards:


@Component({
    selector: 'app-table-data',
    templateUrl: './table-data.component.html',
    styleUrls: ['./table-data.component.scss'],
})
export class TableDataComponent // dont forget this one, must match the ones in app-routing.module.ts
