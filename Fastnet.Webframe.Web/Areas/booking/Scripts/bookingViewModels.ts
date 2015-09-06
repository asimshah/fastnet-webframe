module fastnet {
    export module booking {
        import forms = fastnet.forms;
        import str = fastnet.util.str;
        import h$ = fastnet.util.helper;

        export module login {
            export class loginModels  extends forms.models{
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
        export class requestModels extends forms.models {
            current: request;
            original: request;
        }
       // export class request extends forms.viewModel {
        export class request extends forms.model  {
            public startDate: Date;
            public endDate: Date;
            public numberOfPeople: number;
        }
        interface requestOptions {
            maximumNumberOfPeople: number;
        }
        export class observableRequest extends forms.viewModel {
            public startDate: KnockoutObservable<Date>;
            public endDate: KnockoutObservable<Date>;
            public numberOfPeople: KnockoutObservable<number>;
            public helpText: any;// KnockoutComputed<string>;
            constructor(req: request, opts: requestOptions) {
                super();
                this.startDate = ko.observable<Date>(req.startDate).extend({
                    required: { message: "A start date is required" },
                });
                this.endDate = ko.observable<Date>(req.endDate).extend({
                    required: { message: "An end date is required" },
                    bookingEndDate: { startDate: this.startDate, fred: "asim" }
                });
                this.startDate.subscribe((cd) => {
                    var sdm = this.toMoment(cd);
                    var edm = this.toMoment(this.endDate());
                    var duration = (edm === null) ? 0 : edm.diff(sdm);
                    if (duration < 1) {
                        this.endDate(sdm.add(1, 'd').toDate());
                    }
                }, this);
                this.numberOfPeople = ko.observable<number>(req.numberOfPeople).extend({
                    required: { message: "Please provide the number of people in the party" },
                    min: { params: 1, message: "The number of people must be at least 1" },
                    max: {
                        params: opts.maximumNumberOfPeople,
                        message: str.format("The maximum number of people that can be acommodated is {0}", opts.maximumNumberOfPeople)
                    }
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
    }
}
