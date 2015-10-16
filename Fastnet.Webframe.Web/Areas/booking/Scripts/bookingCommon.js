var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var fastnet;
(function (fastnet) {
    var booking;
    (function (booking) {
        var forms = fastnet.forms;
        var parameterModels = (function (_super) {
            __extends(parameterModels, _super);
            function parameterModels() {
                _super.apply(this, arguments);
            }
            return parameterModels;
        })(forms.models);
        booking.parameterModels = parameterModels;
        var parameters = (function () {
            function parameters() {
            }
            parameters.prototype.getObservable = function () {
                return new observableParameters(this);
            };
            parameters.prototype.setFromJSON = function (data) {
                $.extend(this, data);
            };
            return parameters;
        })();
        booking.parameters = parameters;
        var observableParameters = (function (_super) {
            __extends(observableParameters, _super);
            function observableParameters(m) {
                _super.call(this);
                this.termsAndConditionsUrl = ko.observable(m.termsAndConditionsUrl);
                this.availableGroups = m.availableGroups;
            }
            return observableParameters;
        })(forms.viewModel);
        booking.observableParameters = observableParameters;
        var requestCustomiser = (function () {
            function requestCustomiser() {
            }
            requestCustomiser.prototype.customise_Step1 = function (stepObservable) {
            };
            return requestCustomiser;
        })();
        booking.requestCustomiser = requestCustomiser;
    })(booking = fastnet.booking || (fastnet.booking = {}));
})(fastnet || (fastnet = {}));
//# sourceMappingURL=bookingCommon.js.map