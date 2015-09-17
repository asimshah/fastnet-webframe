var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var fastnet;
(function (fastnet) {
    var forms = fastnet.forms;
    var test;
    (function (test) {
        var testModels = (function (_super) {
            __extends(testModels, _super);
            function testModels() {
                _super.apply(this, arguments);
            }
            return testModels;
        })(forms.models);
        test.testModels = testModels;
        var order = (function () {
            function order() {
            }
            return order;
        })();
        var observableOrder = (function () {
            function observableOrder(order) {
                this.id = ko.observable(order.id);
                this.quantity = ko.observable(order.quantity).extend({
                    min: 2
                });
                this.price = ko.observable(order.price);
            }
            return observableOrder;
        })();
        var testModel = (function (_super) {
            __extends(testModel, _super);
            function testModel() {
                _super.apply(this, arguments);
            }
            return testModel;
        })(forms.model);
        test.testModel = testModel;
        var observableTestModel = (function (_super) {
            __extends(observableTestModel, _super);
            function observableTestModel(tm) {
                var _this = this;
                _super.call(this);
                // removeOrder() is called by knockout, so
                // to retain the value of "this", this lambda 
                // pattern is necessary
                this.removeOrder = function (order) {
                    _this.orders.remove(order);
                };
                this.self = this;
                this.email = ko.observable(tm.email).extend({
                    required: { message: 'An email address is required' },
                    emailInUse: { message: "my custom message" }
                });
                this.password = ko.observable(tm.password).extend({
                    required: { message: 'An password is required' },
                    passwordComplexity: true
                });
                this.valueDate = ko.observable(tm.valueDate);
                this.orders = ko.observableArray();
                tm.orders.forEach(function (o, i, arr) {
                    _this.orders.push(new observableOrder(o));
                });
            }
            observableTestModel.prototype.addOrder = function () {
                this.orders.push(new observableOrder(new order()));
            };
            return observableTestModel;
        })(forms.viewModel);
        test.observableTestModel = observableTestModel;
    })(test = fastnet.test || (fastnet.test = {}));
})(fastnet || (fastnet = {}));
//# sourceMappingURL=testViewModels.js.map