import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface FilterSet {
    viewId: number;
    filters: Array<Filter>;
}

export interface Filter {
    name: string;
    icon?: string;
    groups: Array<FilterGroup>;
}

export interface FilterGroup {
    header: string;
    members: Array<FilterMember>;
}

export interface FilterMember {
    text: string;
    tags: Array<string>;
    active: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class FilterEntityService {

    public entities$: Observable<Array<FilterSet>> = of(undefined); //  tableData$();


    // public update = (change: any) => console.log('Should update', change);


}
