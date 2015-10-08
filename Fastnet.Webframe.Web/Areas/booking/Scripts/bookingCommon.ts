module fastnet {
    export module booking {
        import forms = fastnet.forms;
        import str = fastnet.util.str;
        import h$ = fastnet.util.helper;
        import debug = fastnet.util.debug;
        export class parameterModels extends forms.models {
            current: parameters;
            original: parameters;
        }
        export class parameters implements server.bookingParameters {
            public factoryName: string;
            public availableGroups: server.IGroup[];
            public termsAndConditionsUrl: string;
            public maximumOccupants: number;
            public currentAbode: server.abode;
            public abodes: server.abode[];
            public paymentGatewayAvailable: boolean;
            public today: string;
            constructor() {

            }
            public getObservable(): observableParameters {
                return new observableParameters(this);
            }
            public setFromJSON(data: any) {
                $.extend(this, data);
            }
        }
        export class observableParameters extends forms.viewModel {
            public availableGroups: server.IGroup[];
            public termsAndConditionsUrl: KnockoutObservable<string>;
            constructor(m: parameters) {
                super();
                this.termsAndConditionsUrl = ko.observable(m.termsAndConditionsUrl);
                this.availableGroups = m.availableGroups;
            }
        }
        export class requestCustomiser {
            public customise_Step1(stepObservable: observableRequest_step1): void {
            }
        }
    }
}