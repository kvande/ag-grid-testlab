
# Info regarding AG Grid and Angular

### To avoid having to figure this stuff out every time, this readme was created  

!! IF using Angular template bindings !!

The Grid options is a vital part
https://www.ag-grid.com/documentation/angular/grid-properties/

The typings for it can be found here: .../node_modules/ag-grid-community/dist/lib/entities/gridOptions.d.ts

### How to use AG Grid in Angular template

* Data is bound with normal Angular square brackets, like [gridOptions]  
* Events are bound with normal Angular square brackets, like (cellValueChanged)  
* Callbacks are bound square brackets as well, like [getRowNodeId]  

Have to consult the docs to find available data, events and callback. And also use the gridOptions.d.ts