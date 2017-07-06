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
    var booking;
    (function (booking) {
        var forms = fastnet.forms;
        var str = fastnet.util.str;
        var h$ = fastnet.util.helper;
        var parameterModels = (function (_super) {
            __extends(parameterModels, _super);
            function parameterModels() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return parameterModels;
        }(forms.models));
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
        }());
        booking.parameters = parameters;
        var observableParameters = (function (_super) {
            __extends(observableParameters, _super);
            function observableParameters(m) {
                var _this = _super.call(this) || this;
                _this.__$className = "observableParameters";
                _this.termsAndConditionsUrl = ko.observable(m.termsAndConditionsUrl);
                _this.availableGroups = m.availableGroups;
                return _this;
            }
            return observableParameters;
        }(forms.viewModel));
        booking.observableParameters = observableParameters;
        var requestCustomiser = (function () {
            function requestCustomiser() {
            }
            requestCustomiser.prototype.customise_Step1 = function (stepObservable) {
            };
            return requestCustomiser;
        }());
        booking.requestCustomiser = requestCustomiser;
        var bookingAppValidations = (function () {
            function bookingAppValidations() {
            }
            bookingAppValidations.GetValidators = function () {
                var rules = [];
                rules.push({ name: "bookingStartDate", async: false, validator: bookingAppValidations.validateBookingStartDate, message: "This arrival date is not valid" });
                rules.push({ name: "bookingEndDate", async: false, validator: bookingAppValidations.validateBookingEndDate, message: "This departure date is not valid" });
                rules.push({ name: "dateGreaterThan", async: false, validator: bookingAppValidations.validateDateGreaterThan, message: "This date is not valid" });
                //rules.push({ name: "bookingEndDate2", async: true, validator: bookingAppValidations.validateBookingEndDate2, message: "This end date is not valid" });
                return rules;
            };
            return bookingAppValidations;
        }());
        bookingAppValidations.validateDateGreaterThan = function (val, params) {
            var refDate = str.toMoment(params);
            var thisDate = str.toMoment(val);
            var diff = thisDate.diff(refDate, 'd');
            return diff >= 0;
        };
        //public static validateBookingStartDate: forms.knockoutValidator = function (val, params): boolean {
        //    if (h$.isNullOrUndefined(val)) {
        //        return true;
        //    }
        //    var shortTermBookingAllowed: boolean = params.shortTermBookingAllowed;
        //    var under18Present = ko.unwrap(params.under18Present);
        //    var today = moment(params.today);
        //    var fmt = "";
        //    var startMoment = moment(val);
        //    var minStart = today;
        //    var interval = 0;// params.shortBookingInterval;
        //    if (under18Present) {
        //        // interval = params.shortBookingInterval + 14;
        //        interval = 14;
        //        fmt = "When any under 18s are present, bookings need to be at least {0} days in advance, i.e. from {1}";
        //    } else if (shortTermBookingAllowed == false) {
        //        interval = params.shortBookingInterval;
        //        fmt = "Bookings need to be at least {0} days in advance, i.e.from {1}";
        //    }
        //    minStart = today.add(interval, 'd');
        //    if (startMoment < minStart) {
        //        this.message = str.format(fmt, interval, str.toDateString(minStart));
        //        return false;
        //    } else {
        //        return true;
        //    }
        //}
        bookingAppValidations.validateBookingStartDate = function (val, params) {
            if (h$.isNullOrUndefined(val)) {
                return true;
            }
            var shortTermBookingAllowed = params.shortTermBookingAllowed;
            var under18Present = ko.unwrap(params.under18Present);
            var today = str.toMoment(params.today); // moment(params.today);
            var fmt = "";
            var startMoment = str.toMoment(val); // moment(val);
            var minStart = today;
            var interval = 0; // params.shortBookingInterval;
            if (under18Present) {
                // interval = params.shortBookingInterval + 14;
                interval = 14;
                fmt = "When any under 18s are present, bookings need to be at least {0} days in advance, i.e. from {1}";
            }
            else if (shortTermBookingAllowed == false) {
                interval = params.shortBookingInterval;
                fmt = "Bookings need to be at least {0} days in advance, i.e.from {1}";
            }
            minStart = today.add(interval, 'd');
            if (startMoment < minStart) {
                this.message = str.format(fmt, interval, str.toDateString(minStart));
                return false;
            }
            else {
                return true;
            }
        };
        //public static validateBookingEndDate: forms.knockoutValidator = function (val, params): boolean {
        //    if (h$.isNullOrUndefined(val)) {
        //        return true;
        //    }
        //    var startDate = ko.unwrap(params.startDate);
        //    if (h$.isNullOrUndefined(startDate)) {
        //        this.message = "No departure date is valid without an arrival date";
        //        return false;
        //    }
        //    var startMoment = moment(startDate);
        //    var endMoment = moment(val);
        //    var d = endMoment.diff(startMoment, 'd');
        //    if (d > 0) {
        //        return true;
        //    } else {
        //        this.message = "Departure date must be after the arrival date";
        //        return false;
        //    }
        //}
        bookingAppValidations.validateBookingEndDate = function (val, params) {
            if (h$.isNullOrUndefined(val)) {
                return true;
            }
            var startDate = ko.unwrap(params.startDate);
            if (h$.isNullOrUndefined(startDate)) {
                this.message = "No departure date is valid without an arrival date";
                return false;
            }
            var startMoment = str.toMoment(startDate); // moment(startDate);
            var endMoment = str.toMoment(val); // moment(val);
            var d = endMoment.diff(startMoment, 'd');
            if (d > 0) {
                return true;
            }
            else {
                this.message = "Departure date must be after the arrival date";
                return false;
            }
        };
        booking.bookingAppValidations = bookingAppValidations;
        var addressModels = (function (_super) {
            __extends(addressModels, _super);
            function addressModels() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return addressModels;
        }(forms.models));
        booking.addressModels = addressModels;
        var addressModel = (function (_super) {
            __extends(addressModel, _super);
            function addressModel(firstName, surname) {
                var _this = _super.call(this) || this;
                _this.firstNames = firstName;
                _this.surname = surname;
                _this.address1 = null;
                _this.address2 = null;
                _this.city = null;
                _this.postCode = null;
                return _this;
            }
            return addressModel;
        }(forms.model));
        booking.addressModel = addressModel;
        var observableAddressModel = (function (_super) {
            __extends(observableAddressModel, _super);
            function observableAddressModel(m) {
                var _this = _super.call(this) || this;
                _this.firstNames = ko.observable(m.firstNames);
                _this.surname = ko.observable(m.surname);
                _this.address1 = ko.observable(m.address1);
                _this.address2 = ko.observable(m.address2);
                _this.city = ko.observable(m.city);
                _this.postCode = ko.observable(m.postCode);
                _this.firstNames.extend({
                    required: { message: "One or more first names are required" }
                });
                _this.surname.extend({
                    required: { message: "A surname is required" }
                });
                _this.address1.extend({
                    required: { message: "An address line is required" }
                });
                _this.city.extend({
                    required: { message: "A UK city is required" }
                });
                _this.postCode.extend({
                    required: { message: "A UK post code in the standard format is required" }
                });
                return _this;
            }
            return observableAddressModel;
        }(forms.viewModel));
        booking.observableAddressModel = observableAddressModel;
    })(booking = fastnet.booking || (fastnet.booking = {}));
})(fastnet || (fastnet = {}));
//# sourceMappingURL=bookingCommon.js.map