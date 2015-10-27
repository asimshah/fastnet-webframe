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
        var str = fastnet.util.str;
        var h$ = fastnet.util.helper;
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
        var bookingAppValidations = (function () {
            function bookingAppValidations() {
            }
            bookingAppValidations.GetValidators = function () {
                var rules = [];
                rules.push({ name: "bookingEndDate", async: false, validator: bookingAppValidations.validateBookingEndDate, message: "This end date is not valid" });
                rules.push({ name: "dateGreaterThan", async: false, validator: bookingAppValidations.validateDateGreaterThan, message: "This date is not valid" });
                //rules.push({ name: "bookingEndDate2", async: true, validator: bookingAppValidations.validateBookingEndDate2, message: "This end date is not valid" });
                return rules;
            };
            bookingAppValidations.validateDateGreaterThan = function (val, params) {
                var refDate = str.toMoment(params);
                var thisDate = str.toMoment(val);
                var diff = thisDate.diff(refDate, 'd');
                return diff >= 0;
            };
            bookingAppValidations.validateBookingEndDate = function (val, params) {
                if (h$.isNullOrUndefined(val)) {
                    return true;
                }
                var startDate = ko.unwrap(params.startDate);
                if (h$.isNullOrUndefined(startDate)) {
                    this.message = "No end date is valid without a start date";
                    return false;
                }
                var startMoment = moment(startDate);
                var endMoment = moment(val);
                var d = endMoment.diff(startMoment, 'd');
                if (d > 0) {
                    return true;
                }
                else {
                    this.message = "End date must be after start date";
                    return false;
                }
            };
            return bookingAppValidations;
        })();
        booking.bookingAppValidations = bookingAppValidations;
    })(booking = fastnet.booking || (fastnet.booking = {}));
})(fastnet || (fastnet = {}));
//# sourceMappingURL=bookingCommon.js.map