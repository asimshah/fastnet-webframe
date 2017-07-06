var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var fastnet;
(function (fastnet) {
    var forms = fastnet.forms;
    var test;
    (function (test) {
        var testModels = (function (_super) {
            __extends(testModels, _super);
            function testModels() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return testModels;
        }(forms.models));
        test.testModels = testModels;
        var order = (function () {
            function order() {
            }
            return order;
        }());
        var observableOrder = (function () {
            function observableOrder(order) {
                this.id = ko.observable(order.id);
                this.quantity = ko.observable(order.quantity).extend({
                    min: 2
                });
                this.price = ko.observable(order.price);
            }
            return observableOrder;
        }());
        var testModel = (function (_super) {
            __extends(testModel, _super);
            function testModel() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return testModel;
        }(forms.model));
        test.testModel = testModel;
        var observableTestModel = (function (_super) {
            __extends(observableTestModel, _super);
            function observableTestModel(tm) {
                var _this = _super.call(this) || this;
                // removeOrder() is called by knockout, so
                // to retain the value of "this", this lambda 
                // pattern is necessary
                _this.removeOrder = function (order) {
                    _this.orders.remove(order);
                };
                _this.self = _this;
                _this.email = ko.observable(tm.email).extend({
                    required: { message: 'An email address is required' },
                    emailInUse: { message: "my custom message" }
                });
                _this.password = ko.observable(tm.password).extend({
                    required: { message: 'An password is required' },
                    passwordComplexity: true
                });
                _this.valueDate = ko.observable(tm.valueDate);
                _this.orders = ko.observableArray();
                tm.orders.forEach(function (o, i, arr) {
                    _this.orders.push(new observableOrder(o));
                });
                return _this;
            }
            observableTestModel.prototype.addOrder = function () {
                this.orders.push(new observableOrder(new order()));
            };
            return observableTestModel;
        }(forms.viewModel));
        test.observableTestModel = observableTestModel;
    })(test = fastnet.test || (fastnet.test = {}));
})(fastnet || (fastnet = {}));
//# sourceMappingURL=testViewModels.js.map