import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TimeSeriesIdentifier } from './time-series';



export interface ViewInputParameters {
    viewId: number;
    title: string;
    style: string;
    timeSeries?: Array<TimeSeriesIdentifier>;
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {

    constructor(private router: Router) {}


    public inputParameters: ViewInputParameters = {
        viewId: 1,
        title: 'Ping pong',
        style: 'some kind of a style',
        timeSeries: []
    }

    public naigateToRoute = (event: any) => {

        // this.router.navigate()




    }


}
