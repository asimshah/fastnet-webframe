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
        export class bookingAppValidations {
            public static validateDateGreaterThan: forms.knockoutValidator = function (val, params): boolean {
                var refDate = str.toMoment(params)
                var thisDate = str.toMoment(val);
                var diff = thisDate.diff(refDate, 'd');
                return diff >= 0;
            }
            public static validateBookingEndDate: forms.knockoutValidator = function (val, params): boolean {
                if (h$.isNullOrUndefined(val)) {
                    return true;
                }
                var startDate = ko.unwrap(params.startDate);
                if (h$.isNullOrUndefined(startDate)) {
                    this.message = "No end date is valid without a start date";
                    return false;
                }
                var startMoment = moment(startDate);
                var endMoment = moment(val);
                var d = endMoment.diff(startMoment, 'd');
                if (d > 0) {
                    return true;
                } else {
                    this.message = "End date must be after start date";
                    return false;
                }
            }
            public static GetValidators() {
                var rules: any[] = [];
                rules.push({ name: "bookingEndDate", async: false, validator: bookingAppValidations.validateBookingEndDate, message: "This end date is not valid" });
                rules.push({ name: "dateGreaterThan", async: false, validator: bookingAppValidations.validateDateGreaterThan, message: "This date is not valid" });
                //rules.push({ name: "bookingEndDate2", async: true, validator: bookingAppValidations.validateBookingEndDate2, message: "This end date is not valid" });
                return rules;
            }
        }
    }
}