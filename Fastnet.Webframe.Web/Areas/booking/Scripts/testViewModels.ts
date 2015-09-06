module fastnet {
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
        export class testModels extends forms.models {
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
        export class testModel extends forms.model implements ITestModel {
            public email: string;
            public password: string;
            public valueDate: Date;
            public orders: order[];
            //public fromJSObject(data: ITestModel): void {
            //    super.fromJSObject(data);
            //}
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
}