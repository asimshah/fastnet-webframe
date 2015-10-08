/// <reference path="../../../scripts/typings/jquery/jquery.d.ts" />
/// <reference path="../../../scripts/typings/jqueryui/jqueryui.d.ts" />
/// <reference path="../../../scripts/typings/moment/moment.d.ts" />
/// <reference path="../../../scripts/typings/knockout/knockout.d.ts" />
/////// <reference path="../../../scripts/collections/collections.d.ts" />
///// <reference path="../../../scripts/typings/knockout.validation/knockout.validation.modified.d.ts" />


module fastnet {
    import ajax = fastnet.util.ajax;
    import debug = fastnet.util.debug;
    import str = fastnet.util.str;
    import wt = fastnet.web.tools;
    import forms = fastnet.forms;
    //import test = bookingVM.test.
    import testVM = fastnet.test.testModel;
    import oTestVM = fastnet.test.observableTestModel;
    import formData = fastnet.test.testModels;
    class testValidations {
        public static emailInUse: forms.knockoutAsyncValidator = function (val, params, callback): void {
            var url = str.format("bookingapi/test/{0}/", val);
            ajax.Get({ url: url }).then((r) => {
                callback({ isValid: r.Success, message: r.Error });
            });
        }
        public static GetValidators() {
            var rules: any[] = [];
            rules.push({ name: "emailInUse", async: true, validator: testValidations.emailInUse, message: "This email address not found" });
            return rules;
        }
    }
    class configuration {
        public static getFormStyleClasses(): string[] {
            return ["booking-forms"];
        }
    }
    //interface ITestModel {
    //    email: string;
    //    password: string;
    //    valueDate: Date;
    //    orders: order[];
    //}
    //class order {
    //    public id: string;
    //    public quantity: number;
    //    public price: number;
    //}
    //class ko_order {
    //    public id: KnockoutObservable<string>;
    //    public quantity: KnockoutObservable<number>;
    //    public price: KnockoutObservable<number>;
    //    constructor(order: order) {
    //        this.id = ko.observable<string>(order.id);
    //        this.quantity = ko.observable<number>(order.quantity).extend({
    //            min: 2
    //        });
    //        this.price = ko.observable<number>(order.price);
    //    }
    //}
    //class testModel extends forms.viewModel implements ITestModel {
    //    public email: string;
    //    public password: string;
    //    public valueDate: Date;
    //    public orders: order[];
    //    public fromJSObject(data: ITestModel): void {
    //        super.fromJSObject(data);
    //    }
    //}
    //class ko_testModel extends forms.viewModel {
    //    public email: KnockoutObservable<string>;
    //    public password: KnockoutObservable<string>;
    //    public valueDate: KnockoutObservable<Date>;
    //    public orders: KnockoutObservableArray<ko_order>;
    //    constructor(tm: testModel) {
    //        super();
    //        this.email = ko.observable<string>(tm.email).extend({
    //            required: { message: 'An email address is required' },
    //            emailInUse: { message: "my custom message" }
    //        });
    //        this.password = ko.observable<string>(tm.password);
    //        this.valueDate = ko.observable<Date>(tm.valueDate);
    //        this.orders = ko.observableArray<ko_order>();
    //        tm.orders.forEach((o, i, arr) => {
    //            this.orders.push(new ko_order(o));
    //        });
    //    }
    //}
    //interface returnedData {
    //    current: testModel;
    //    original: testModel;
    //}
    export class tests {
        private tf: forms.form = null;
        private model: testVM = null;
        public start(): void {
            var config: forms.configuration = {
                modelessContainer: "booking-interaction",
                additionalValidations: testValidations.GetValidators()
            };
            forms.form.initialise(config);
            $("button[data-cmd='test-form']").click((e) => {
                this.startTestForm();
            });
        }
        private startTestForm(): void {
            debug.print("tests started");
            this.model = new testVM();
            this.model.setFromJSON({
                email: null, password: null, valueDate: new Date(),
                orders: [
                    { id: "o1", quantity: 2, price: 23.0 },
                    { id: "o2", quantity: 8, price: 48.0 }
                ]
            });
            var vm = new oTestVM(this.model);
            var buttons: forms.formButton[] = [
                {
                    text: "Add Row",
                    command: "add-row",
                    position: forms.buttonPosition.left,
                    dataBinding: "click: addOrder"
                }
            ];
            this.tf = new forms.form(this, {
                initialWidth: 500,
                modal: false,
                title: "Test Form",
                styleClasses: configuration.getFormStyleClasses(),
                okButtonText: "Test",
                additionalButtons: buttons
            }, vm);
            var testFormUrl = "booking/testform";
            wt.getTemplate({ ctx: this, templateUrl: testFormUrl }).then((r) => {
                this.tf.setContentHtml(r.template);
                this.tf.open((ctx: tests, f: forms.form, cmd: string, data: formData) => {
                    switch (cmd) {
                        case "cancel-command":
                            f.close();
                            break;
                        case "ok-command":
                            if (f.isValid()) {
                                debug.print("form is valid");
                                debug.print("new email: {0}, old email: {1}", data.current.email, data.original.email);
                                f.close();
                            } else {
                                debug.print("form is not valid");
                            }
                            break;
                        default:
                            debug.print("test form: command {0}", cmd);
                            break;
                    }
                });
            });

        }
    }
}