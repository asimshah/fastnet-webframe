module fastnet {
    export module booking {
        import forms = fastnet.forms;
        import str = fastnet.util.str;
        import h$ = fastnet.util.helper;
        import debug = fastnet.util.debug;
        //export interface IGroup {
        //    Id: number;
        //    Name: string;
        //}
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
        export class observableParameters extends forms.viewModel  {
            public availableGroups: server.IGroup[];
            public termsAndConditionsUrl: KnockoutObservable<string>;
            constructor(m: parameters) {
                super();
                this.termsAndConditionsUrl = ko.observable(m.termsAndConditionsUrl);
                this.availableGroups = m.availableGroups;
            }
        }
        export module login {
            export class loginModels extends forms.models {
                current: credentials;
                original: credentials;
            }
            //export class credentials extends forms.viewModel {
            export class credentials extends forms.model {
                public email: string;
                public password: string;
            }
            export class observableCredentials extends forms.viewModel {
                public email: KnockoutObservable<string>;
                public password: KnockoutObservable<string>;
                constructor(m: credentials) {
                    super();
                    this.email = ko.observable<string>(m.email).extend({
                        required: { message: "An email address is required" }
                    });
                    this.password = ko.observable<string>().extend({
                        required: { message: "A password is required" }
                    });
                }
            }
        }
        export class step1Models extends forms.models {
            current: request_step1;
            original: request_step1;
        }
        export class request_step1 extends forms.model {
            public startDate: Date;
            public endDate: Date;
            public numberOfPeople: number;
            public mobileNumber: string;
            constructor() {
                super();
                this.startDate = null;
                this.endDate = null;
                this.numberOfPeople = null;//0;
            }
        }
        interface requestOptions {
            maximumNumberOfPeople: number;
        }
        export class observableRequest_step1 extends forms.viewModel {
            public startDate: KnockoutObservable<Date>;
            public endDate: KnockoutObservable<Date>;
            public numberOfPeople: KnockoutObservable<number>;
            public helpText: any;// KnockoutComputed<string>;
            public mobileNumber: KnockoutObservable<string>;
            constructor(m: request_step1, opts: requestOptions) {
                super();
                //var edChangeFocusBlocked = false;
                this.startDate = ko.observable<Date>(m.startDate).extend({
                    required: { message: "A start date is required" },
                });
                this.endDate = ko.observable<Date>(m.endDate).extend({
                    required: { message: "An end date is required" },
                    bookingEndDate: { startDate: this.startDate, fred: "asim" }
                });
                this.startDate.subscribe((cd) => {
                    var sdm = this.toMoment(cd);
                    var edm = this.toMoment(this.endDate());
                    var duration = (edm === null) ? 0 : edm.diff(sdm);
                    if (duration < 1) {
                        //edChangeFocusBlocked = true;
                        this.endDate(sdm.add(1, 'd').toDate());
                        //edChangeFocusBlocked = false;
                    }
                }, this);
                this.numberOfPeople = ko.observable<number>(m.numberOfPeople).extend({
                    required: { message: "Please provide the number of people in the party" },
                    min: { params: 1, message: "The number of people must be at least 1" },
                    max: {
                        params: opts.maximumNumberOfPeople,
                        message: str.format("The maximum number of people that can be acommodated is {0}", opts.maximumNumberOfPeople)
                    }
                });
                this.mobileNumber = ko.observable(m.mobileNumber).extend({
                    required: { message: "Please provide a mobile number" },
                    phoneNumber: true
                });
                this.helpText = function () {
                    return this.getHelpText();
                }
            }
            private toMoment(d: Date): moment.Moment {
                if (h$.isNullOrUndefined(d)) {
                    return null;
                } else {
                    return moment(d);
                }
            }
            public reset(): void {
                this.startDate(null);
                this.startDate.isModified(false);
                this.endDate(null);
                this.endDate.isModified(false);
                this.numberOfPeople(null);
                this.numberOfPeople.isModified(false);
            }
            public getHelpText(): string {
                var sdm = this.toMoment(this.startDate());
                var edm = this.toMoment(this.endDate());
                var people = this.numberOfPeople();
                var duration = sdm === null || edm === null || h$.isNullOrUndefined(people) ? 0 : edm.diff(sdm, 'd');
                if (duration > 0) {
                    return str.format("Request is for {0} {2} for {1} {3}",
                        people, duration, people === 1 ? "person" : "people", duration === 1 ? "night" : "nights");
                }
                else {
                    return "";
                }
            }
        }
        //
        //
        export class step2Models extends forms.models {
            current: request_step2;
            original: request_step2;
        }
        export class request_step2 extends forms.model {
            public choices: server.bookingChoice[];
        }
        export class observableBookingChoice extends forms.viewModel {  
            public choiceNumber: number;      
            public totalCost: number;
            public description: string;
            constructor(m: server.bookingChoice) {
                super();
                this.choiceNumber = m.choiceNumber;
                this.totalCost = m.totalCost;
                this.description = m.description;
            }
        }
        export class observableRequest_step2 extends forms.viewModel {
            public announcement: string;
            public choices: KnockoutObservableArray<observableBookingChoice>;
            public selected: any;
            public fromDate: string;
            public toDate: string;
            public numberOfPeople: number;
            constructor(m: request_step2, fromDate: string, toDate: string, numberOfPeople: number) {
                super();
                this.fromDate = fromDate;
                this.toDate = toDate;
                this.numberOfPeople = numberOfPeople;
                this.choices = ko.observableArray<observableBookingChoice>();
                m.choices.forEach((o, i, arr) => {
                    this.choices.push(new observableBookingChoice(o));
                });
                // initially choose the first item in the array
                this.selected = ko.observable(m.choices[0].choiceNumber);
                this.announcement = str.format("From {0} to {1}, the following alternatives are available for {2} people:",
                    this.fromDate, this.toDate, this.numberOfPeople);
            }
        }
        export class request_step3 extends forms.model {
            public fromDate: string;
            public toDate: string;
            public choice: server.bookingChoice;
            //public phoneNumber: string;
            public under18Present: boolean;
            public tcLinkAvailable: boolean;
            public tcLink: string;
            public tcAgreed: boolean;
            public shortTermBookingInterval: number;
            public paymentGatewayAvailable: boolean;
            public isShortTermBooking: boolean;
            constructor(fromDate: string, toDate: string, choice: server.bookingChoice,
                tcLink: string, isShortTermBooking: boolean,
                shortTermBookingInterval: number, paymentGatewayAvailable: boolean) {
                super();
                this.fromDate = fromDate;
                this.toDate = toDate;
                this.choice = choice;
                //this.phoneNumber = phoneNumber;
                this.tcLinkAvailable = tcLink !== null;
                this.tcLink = tcLink;
                this.isShortTermBooking = isShortTermBooking;
                this.shortTermBookingInterval = shortTermBookingInterval;
                this.paymentGatewayAvailable = paymentGatewayAvailable;
            }
        }
        export class observableRequest_step3 extends forms.viewModel {
            public fromDate: string;
            public toDate: string;
            public choice: server.bookingChoice;
            //public phoneNumber: KnockoutObservable<string>;
            public under18Present: KnockoutObservable<boolean>;
            public tcLinkAvailable: boolean;
            public tcLink: string;
            public tcAgreed: KnockoutObservable<boolean>;
            public shortTermBookingInterval: number;
            public paymentGatewayAvailable: boolean;
            public isShortTermBooking: boolean;
            public showPaymentRequiredMessage: boolean;
            constructor(m: request_step3) {
                super();
                this.fromDate = str.toMoment(m.fromDate).format("ddd DDMMMYYYY");
                this.toDate = str.toMoment(m.toDate).format("ddd DDMMMYYYY");// m.toDate;
                this.choice = m.choice;
                //this.phoneNumber = ko.observable(m.phoneNumber);
                this.under18Present = ko.observable(false);
                this.tcLinkAvailable = m.tcLinkAvailable;
                this.tcLink = m.tcLink;
                this.tcAgreed = ko.observable(false).extend({
                    isChecked: { message: "Please confirm agreement with the Terms and Conditions" }
                });
                this.isShortTermBooking = m.isShortTermBooking;
                this.shortTermBookingInterval = m.shortTermBookingInterval;
                this.paymentGatewayAvailable = m.paymentGatewayAvailable;
                this.showPaymentRequiredMessage = m.paymentGatewayAvailable === true && m.isShortTermBooking;
            }
        }
    }
}
