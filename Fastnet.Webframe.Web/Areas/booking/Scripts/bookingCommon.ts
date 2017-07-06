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
            public __$className: string = "observableParameters";
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
            //public static validateBookingStartDate: forms.knockoutValidator = function (val, params): boolean {
            //    if (h$.isNullOrUndefined(val)) {
            //        return true;
            //    }
            //    var shortTermBookingAllowed: boolean = params.shortTermBookingAllowed;
            //    var under18Present = ko.unwrap(params.under18Present);
            //    var today = moment(params.today);
            //    var fmt = "";
            //    var startMoment = moment(val);
            //    var minStart = today;
            //    var interval = 0;// params.shortBookingInterval;
            //    if (under18Present) {
            //        // interval = params.shortBookingInterval + 14;
            //        interval = 14;
            //        fmt = "When any under 18s are present, bookings need to be at least {0} days in advance, i.e. from {1}";
            //    } else if (shortTermBookingAllowed == false) {
            //        interval = params.shortBookingInterval;
            //        fmt = "Bookings need to be at least {0} days in advance, i.e.from {1}";
            //    }
            //    minStart = today.add(interval, 'd');
            //    if (startMoment < minStart) {
            //        this.message = str.format(fmt, interval, str.toDateString(minStart));
            //        return false;
            //    } else {
            //        return true;
            //    }
            //}
            public static validateBookingStartDate: forms.knockoutValidator = function (val, params): boolean {
                if (h$.isNullOrUndefined(val)) {
                    return true;
                }
                var shortTermBookingAllowed: boolean = params.shortTermBookingAllowed;
                var under18Present = ko.unwrap(params.under18Present);
                var today = str.toMoment(params.today);// moment(params.today);
                var fmt = "";
                var startMoment = str.toMoment(val);// moment(val);
                var minStart = today;
                var interval = 0;// params.shortBookingInterval;
                if (under18Present) {
                   // interval = params.shortBookingInterval + 14;
                    interval = 14;
                    fmt = "When any under 18s are present, bookings need to be at least {0} days in advance, i.e. from {1}";
                } else if (shortTermBookingAllowed == false) {
                    interval = params.shortBookingInterval;
                    fmt = "Bookings need to be at least {0} days in advance, i.e.from {1}";
                }
                minStart = today.add(interval, 'd');
                if (startMoment < minStart) {
                    this.message = str.format(fmt, interval, str.toDateString(minStart));
                    return false;
                } else {
                    return true;
                }
            }
            //public static validateBookingEndDate: forms.knockoutValidator = function (val, params): boolean {
            //    if (h$.isNullOrUndefined(val)) {
            //        return true;
            //    }
            //    var startDate = ko.unwrap(params.startDate);
            //    if (h$.isNullOrUndefined(startDate)) {
            //        this.message = "No departure date is valid without an arrival date";
            //        return false;
            //    }
            //    var startMoment = moment(startDate);
            //    var endMoment = moment(val);
            //    var d = endMoment.diff(startMoment, 'd');
            //    if (d > 0) {
            //        return true;
            //    } else {
            //        this.message = "Departure date must be after the arrival date";
            //        return false;
            //    }
            //}
            public static validateBookingEndDate: forms.knockoutValidator = function (val, params): boolean {
                if (h$.isNullOrUndefined(val)) {
                    return true;
                }
                var startDate = ko.unwrap(params.startDate);
                if (h$.isNullOrUndefined(startDate)) {
                    this.message = "No departure date is valid without an arrival date";
                    return false;
                }
                var startMoment = str.toMoment(startDate);// moment(startDate);
                var endMoment = str.toMoment(val);// moment(val);
                var d = endMoment.diff(startMoment, 'd');
                if (d > 0) {
                    return true;
                } else {
                    this.message = "Departure date must be after the arrival date";
                    return false;
                }
            }
            public static GetValidators() {
                var rules: any[] = [];
                rules.push({ name: "bookingStartDate", async: false, validator: bookingAppValidations.validateBookingStartDate, message: "This arrival date is not valid" });
                rules.push({ name: "bookingEndDate", async: false, validator: bookingAppValidations.validateBookingEndDate, message: "This departure date is not valid" });
                rules.push({ name: "dateGreaterThan", async: false, validator: bookingAppValidations.validateDateGreaterThan, message: "This date is not valid" });
                //rules.push({ name: "bookingEndDate2", async: true, validator: bookingAppValidations.validateBookingEndDate2, message: "This end date is not valid" });
                return rules;
            }
        }
        export class addressModels extends forms.models {
            current: addressModel;
            original: addressModel;
        }
        export class addressModel extends forms.model {
            public firstNames: string;
            public surname: string;
            public address1: string;
            public address2: string;
            public city: string;
            public postCode: string;
            constructor(firstName: string, surname: string) {
                super();
                this.firstNames = firstName;
                this.surname = surname;
                this.address1 = null;
                this.address2 = null;
                this.city = null;
                this.postCode = null;
            }
        }
        export class observableAddressModel extends forms.viewModel {
            public firstNames: KnockoutObservable<string>;
            public surname: KnockoutObservable<string>;
            public address1: KnockoutObservable<string>;
            public address2: KnockoutObservable<string>;
            public city: KnockoutObservable<string>;
            public postCode: KnockoutObservable<string>;
            constructor(m: addressModel) {
                super();
                this.firstNames = ko.observable(m.firstNames);
                this.surname = ko.observable(m.surname);
                this.address1 = ko.observable(m.address1);
                this.address2 = ko.observable(m.address2);
                this.city = ko.observable(m.city);
                this.postCode = ko.observable(m.postCode);
                this.firstNames.extend({
                    required: {message: "One or more first names are required"}
                });
                this.surname.extend({
                    required: {message: "A surname is required"}
                });
                this.address1.extend({
                    required: {message: "An address line is required"}
                });
                this.city.extend({
                    required: { message: "A UK city is required" }
                });
                this.postCode.extend({
                    required: { message: "A UK post code in the standard format is required" }
                });
            }
        }
    }
}