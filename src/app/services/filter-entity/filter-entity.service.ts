import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { FilterSet } from '../../model/filter';


@Injectable({
    providedIn: 'root'
})
export class FilterEntityService {

    public entities$: Observable<Array<FilterSet>> = of(undefined); //  tableData$();


    // public update = (change: any) => console.log('Should update', change);


}
