/// <reference path="../../../scripts/typings/jquery/jquery.d.ts" />
/// <reference path="../../../scripts/typings/jqueryui/jqueryui.d.ts" />
/// <reference path="../../../scripts/typings/moment/moment.d.ts" />
/// <reference path="../../../scripts/typings/knockout/knockout.d.ts" />
/////// <reference path="../../../scripts/collections/collections.d.ts" />
///// <reference path="../../../scripts/typings/knockout.validation/knockout.validation.modified.d.ts" />
var fastnet;
(function (fastnet) {
    var ajax = fastnet.util.ajax;
    var debug = fastnet.util.debug;
    var str = fastnet.util.str;
    var wt = fastnet.web.tools;
    var forms = fastnet.forms;
    //import test = bookingVM.test.
    var testVM = fastnet.test.testModel;
    var oTestVM = fastnet.test.observableTestModel;
    var testValidations = (function () {
        function testValidations() {
        }
        testValidations.GetValidators = function () {
            var rules = [];
            rules.push({ name: "emailInUse", async: true, validator: testValidations.emailInUse, message: "This email address not found" });
            return rules;
        };
        return testValidations;
    }());
    testValidations.emailInUse = function (val, params, callback) {
        var url = str.format("bookingapi/test/{0}/", val);
        ajax.Get({ url: url }).then(function (r) {
            callback({ isValid: r.Success, message: r.Error });
        });
    };
    var configuration = (function () {
        function configuration() {
        }
        configuration.getFormStyleClasses = function () {
            return ["booking-forms"];
        };
        return configuration;
    }());
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
    var tests = (function () {
        function tests() {
            this.tf = null;
            this.model = null;
        }
        tests.prototype.start = function () {
            var _this = this;
            var config = {
                modelessContainer: "booking-interaction",
                additionalValidations: testValidations.GetValidators()
            };
            forms.form.initialise(config);
            $("button[data-cmd='test-form']").click(function (e) {
                _this.startTestForm();
            });
        };
        tests.prototype.startTestForm = function () {
            var _this = this;
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
            var buttons = [
                {
                    text: "Add Row",
                    command: "add-row",
                    position: 1 /* left */,
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
            wt.getTemplate({ ctx: this, templateUrl: testFormUrl }).then(function (r) {
                _this.tf.setContentHtml(r.template);
                _this.tf.open(function (ctx, f, cmd, data) {
                    switch (cmd) {
                        case "cancel-command":
                            f.close();
                            break;
                        case "ok-command":
                            if (f.isValid()) {
                                debug.print("form is valid");
                                debug.print("new email: {0}, old email: {1}", data.current.email, data.original.email);
                                f.close();
                            }
                            else {
                                debug.print("form is not valid");
                            }
                            break;
                        default:
                            debug.print("test form: command {0}", cmd);
                            break;
                    }
                });
            });
        };
        return tests;
    }());
    fastnet.tests = tests;
})(fastnet || (fastnet = {}));
//# sourceMappingURL=tests.js.map