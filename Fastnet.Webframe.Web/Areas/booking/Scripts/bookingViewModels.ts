module fastnet {
    export module booking {
        import forms = fastnet.forms;
        import str = fastnet.util.str;
        import h$ = fastnet.util.helper;
        import debug = fastnet.util.debug;
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
            public under18Present: boolean;
            public mobileNumber: string;
            public shortTermBookingAllowed: boolean;
            public shortBookingInterval: number;
            public today: moment.Moment;
            constructor(today:moment.Moment, shortTermBookingAllowed: boolean, shortBookingInterval: number) {
                super();
                this.startDate = null;
                this.endDate = null;
                this.numberOfPeople = null;//0;
                this.today = today;
                this.shortBookingInterval = shortBookingInterval;
                this.shortTermBookingAllowed = shortTermBookingAllowed;
            }
        }
        interface requestOptions {
            maximumNumberOfPeople: number;
        }
        export class observableRequest_step1 extends forms.viewModel {
            public startDate: KnockoutObservable<Date>;
            public endDate: KnockoutObservable<Date>;
            public numberOfPeople: KnockoutObservable<number>;
            public under18Present: KnockoutObservable<boolean>;
            public helpText: any;// KnockoutComputed<string>;
            public mobileNumber: KnockoutObservable<string>;
            public shortTermBookingAllowed: boolean;
            public shortBookingInterval: number;
            public today: moment.Moment;
            constructor(m: request_step1, opts: requestOptions) {
                super();
                this.today = m.today;
                this.shortBookingInterval = m.shortBookingInterval;
                this.shortTermBookingAllowed = m.shortTermBookingAllowed;
                //if (!this.shortTermBookingAllowed) {
                //    var minStart = this.today.add(this.shortBookingInterval, 'd');
                //    var msg = str.format("Bookings need to be at least {0} days in advance, i.e. from {1}", this.shortBookingInterval, str.toDateString(minStart));
                //    this.startDate = ko.observable<Date>(m.startDate).extend({
                //        required: { message: "A start date is required" },
                //        dateGreaterThan: { params: minStart,  date: minStart, message: msg }
                //    });
                //} else {
                //    this.startDate = ko.observable<Date>(m.startDate).extend({
                //        required: { message: "An arrival date is required" },
                //    });
                //}
                this.under18Present = ko.observable(false);
                this.startDate = ko.observable<Date>(m.startDate);
                this.under18Present.subscribe((val) => {
                    ko.validation.validateObservable(this.startDate);
                });
                this.startDate.extend({
                    required: { message: "An arrival date is required" },
                    //bookingStartDate: { today: this.today, shortBookingInterval: this.shortBookingInterval, shortTermBookingAllowed: this.shortTermBookingAllowed, under18Present: this.under18Present }
                    bookingStartDate: { today: this.today, todayString: str.toDateString(this.today), shortBookingInterval: this.shortBookingInterval, shortTermBookingAllowed: this.shortTermBookingAllowed, under18Present: this.under18Present }
                });
                this.endDate = ko.observable<Date>(m.endDate).extend({
                    required: { message: "A departure date is required" },
                    bookingEndDate: { startDate: this.startDate, fred: "asim" }
                });
                
                this.startDate.subscribe((cd) => {
                    var sdm = this.toMoment(cd);
                    var edm = this.toMoment(this.endDate());
                    var duration = (edm === null) ? 0 : edm.diff(sdm, "days");
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
                //var tester = factory.getTest();
                var customiser = factory.getRequestCustomiser();
                customiser.customise_Step1(this);
            }
            public toMoment(d: Date): moment.Moment {
                if (h$.isNullOrUndefined(d)) {
                    return null;
                } else {
                    return str.toMoment(d);
                    //return moment(d);
                }
            }
            public reset(): void {
                this.startDate(null);
                this.startDate.isModified(false);
                this.endDate(null);
                this.endDate.isModified(false);
                this.numberOfPeople(null);
                this.numberOfPeople.isModified(false);
                this.under18Present(false);
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
            public formattedCost: string;
            public description: string;
            constructor(m: server.bookingChoice) {
                super();
                this.choiceNumber = m.choiceNumber;
                this.totalCost = m.totalCost;
                this.formattedCost = accounting.formatMoney(this.totalCost, "£", 0, ",", ".", "%s%v");
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
            public under18Present: boolean;
            constructor(m: request_step2, fromDate: string, toDate: string, numberOfPeople: number, under18Present: boolean) {
                super();
                this.fromDate = fromDate;
                this.toDate = toDate;
                this.numberOfPeople = numberOfPeople;
                this.under18Present = under18Present;
                this.choices = ko.observableArray<observableBookingChoice>();
                m.choices.forEach((o, i, arr) => {
                    this.choices.push(new observableBookingChoice(o));
                });
                // initially choose the first item in the array
                this.selected = ko.observable(m.choices[0].choiceNumber);
                this.announcement = str.format("From {0} to {1}, the following alternatives are available for {2} {3}:",
                    this.fromDate, this.toDate, this.numberOfPeople, this.numberOfPeople === 1 ? "person" : "people");
            }
        }
        export class step3Models extends forms.models {
            current: request_step3;
            original: request_step3;
        }
        export class request_step3 extends forms.model {
            public fromDate: string;
            public toDate: string;
            public choice: server.bookingChoice;
            public phoneNumber: string;
            public under18Present: boolean;
            public tcLinkAvailable: boolean;
            public tcLink: string;
            public tcAgreed: boolean;
            public shortTermBookingInterval: number;
            public paymentGatewayAvailable: boolean;
            public isShortTermBooking: boolean;
            public numberOfPeople: number;
            constructor(fromDate: string, toDate: string, choice: server.bookingChoice,
                tcLink: string, isShortTermBooking: boolean,
                shortTermBookingInterval: number, under18Present: boolean,
                phoneNumber: string,
                paymentGatewayAvailable: boolean, np: number) {
                super();
                this.fromDate = fromDate;
                this.toDate = toDate;
                this.choice = choice;
                this.under18Present = under18Present;
                this.phoneNumber = phoneNumber;
                this.tcLinkAvailable = tcLink !== null;
                this.tcLink = tcLink;
                this.isShortTermBooking = isShortTermBooking;
                this.shortTermBookingInterval = shortTermBookingInterval;
                this.paymentGatewayAvailable = paymentGatewayAvailable;
                this.numberOfPeople = np;
            }
        }
        export class observableRequest_step3 extends forms.viewModel {
            public fromDate: string;
            public toDate: string;
            public choice: server.bookingChoice;
            public phoneNumber: string;
            public under18Present: boolean;// KnockoutObservable<boolean>;
            public tcLinkAvailable: boolean;
            public tcLink: string;
            public tcAgreed: KnockoutObservable<boolean>;
            public shortTermBookingInterval: number;
            public paymentGatewayAvailable: boolean;
            public isShortTermBooking: boolean;
            public showPaymentRequiredMessage: boolean;
            public numberOfPeople: number;
            constructor(m: request_step3) {
                super();
                this.fromDate = str.toMoment(m.fromDate).format("ddd DDMMMYYYY");
                this.toDate = str.toMoment(m.toDate).format("ddd DDMMMYYYY");// m.toDate;
                this.choice = m.choice;
                this.choice.formattedCost = accounting.formatMoney(this.choice.totalCost, "£", 0, ",", ".", "%s%v");
                this.phoneNumber = m.phoneNumber;
                this.under18Present = m.under18Present;// ko.observable(false);
                this.tcLinkAvailable = m.tcLinkAvailable;
                this.tcLink = m.tcLink;
                this.tcAgreed = ko.observable(false).extend({
                    isChecked: { message: "Please confirm agreement with the Terms and Conditions" }
                });
                this.isShortTermBooking = m.isShortTermBooking;
                this.shortTermBookingInterval = m.shortTermBookingInterval;
                this.paymentGatewayAvailable = m.paymentGatewayAvailable;
                this.showPaymentRequiredMessage = m.paymentGatewayAvailable === true && m.isShortTermBooking;
                this.numberOfPeople = m.numberOfPeople;
            }
        }
        export class observableMyBookingsModel extends forms.viewModel {
            public bookings: server.booking[];
            public hasBookings: boolean;
            constructor(bookings: server.booking[]) {
                super();
                this.bookings = bookings;
                this.hasBookings = bookings.length > 0;
            }
        }
    }
}
