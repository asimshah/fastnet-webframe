module bookingVM {
    import forms = fastnet.forms;
    import str = fastnet.util.str;
    import h$ = fastnet.util.helper;
    export module test {
        interface ITestModel {
            email: string;
            password: string;
            valueDate: Date;
            orders: order[];
        }
        export class testModelFormData {
            current: testModel;
            original: testModel;
        }
        class order {
            public id: string;
            public quantity: number;
            public price: number;
        }
        class observableOrder {
            public id: KnockoutObservable<string>;
            public quantity: KnockoutObservable<number>;
            public price: KnockoutObservable<number>;
            constructor(order: order) {
                this.id = ko.observable<string>(order.id);
                this.quantity = ko.observable<number>(order.quantity).extend({
                    min: 2
                });
                this.price = ko.observable<number>(order.price);
            }
        }
        export class testModel extends forms.viewModel implements ITestModel {
            public email: string;
            public password: string;
            public valueDate: Date;
            public orders: order[];
            public fromJSObject(data: ITestModel): void {
                super.fromJSObject(data);
            }
        }
        export class observableTestModel extends forms.viewModel {
            public email: KnockoutObservable<string>;
            public password: KnockoutObservable<string>;
            public valueDate: KnockoutObservable<Date>;
            public orders: KnockoutObservableArray<observableOrder>;
            private self: observableTestModel;
            constructor(tm: testModel) {
                super();
                this.self = this;
                this.email = ko.observable<string>(tm.email).extend({
                    required: { message: 'An email address is required' },
                    emailInUse: { message: "my custom message" }
                });
                this.password = ko.observable<string>(tm.password).extend({
                    required: { message: 'An password is required' },
                    passwordComplexity: true
                });
                this.valueDate = ko.observable<Date>(tm.valueDate);
                this.orders = ko.observableArray<observableOrder>();
                tm.orders.forEach((o, i, arr) => {
                    this.orders.push(new observableOrder(o));
                });
            }
            public addOrder(): void {
                this.orders.push(new observableOrder(new order()));
            }
            // removeOrder() is called by knockout, so
            // to retain the value of "this", this lambda 
            // pattern is necessary
            public removeOrder = (order: observableOrder): void => {
                this.orders.remove(order);
            }
        }
    }
    export module login {
        export class formData {
            current: credentials;
            original: credentials;
        }
        export class credentials extends forms.viewModel {
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
    export class requestFormData {
        current: request;
        original: request;
    }
    export class request extends forms.viewModel {
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
                var sd = moment(cd);
                var ed = this.endDate();
                if (h$.isNullOrUndefined(ed)) {
                    this.endDate(sd.add(1, 'd').toDate());
                } else {
                    var med = moment(ed);
                    var duration = med.diff(sd);
                    if (duration < 1) {
                        this.endDate(sd.add(1, 'd').toDate());
                    }
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
        }
    }
}