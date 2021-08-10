

## How to update from 'source'


# Remarks: It there is any custom code in some of the components it will be erased with the copy pasting below, so try to only copy paste 'new test cases'
  


It should be possible to copy the content from the 'official' to these files directly (have to update them all, otherwise there will be build problems):

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
