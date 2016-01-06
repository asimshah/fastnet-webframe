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
                rules.push({ name: "bookingStartDate", async: false, validator: bookingAppValidations.validateBookingStartDate, message: "This arrival date is not valid" });
                rules.push({ name: "bookingEndDate", async: false, validator: bookingAppValidations.validateBookingEndDate, message: "This departure date is not valid" });
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
            bookingAppValidations.validateBookingStartDate = function (val, params) {
                if (h$.isNullOrUndefined(val)) {
                    return true;
                }
                var shortTermBookingAllowed = params.shortTermBookingAllowed;
                var under18Present = ko.unwrap(params.under18Present);
                var today = moment(params.today);
                var fmt = "";
                var startMoment = moment(val);
                var minStart = today;
                var interval = 0; // params.shortBookingInterval;
                if (under18Present) {
                    interval = params.shortBookingInterval + 14;
                    //minStart = today.add(params.shortBookingInterval + 7, 'd');
                    fmt = "When any under 18s are present, bookings need to be at least {0} days in advance, i.e. from {1}";
                }
                else if (shortTermBookingAllowed == false) {
                    interval = params.shortBookingInterval;
                    //minStart = today.add(params.shortBookingInterval, 'd');
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
            bookingAppValidations.validateBookingEndDate = function (val, params) {
                if (h$.isNullOrUndefined(val)) {
                    return true;
                }
                var startDate = ko.unwrap(params.startDate);
                if (h$.isNullOrUndefined(startDate)) {
                    this.message = "No departure date is valid without an arrival date";
                    return false;
                }
                var startMoment = moment(startDate);
                var endMoment = moment(val);
                var d = endMoment.diff(startMoment, 'd');
                if (d > 0) {
                    return true;
                }
                else {
                    this.message = "Departure date must be after the arrival date";
                    return false;
                }
            };
            return bookingAppValidations;
        })();
        booking.bookingAppValidations = bookingAppValidations;
        var addressModels = (function (_super) {
            __extends(addressModels, _super);
            function addressModels() {
                _super.apply(this, arguments);
            }
            return addressModels;
        })(forms.models);
        booking.addressModels = addressModels;
        var addressModel = (function (_super) {
            __extends(addressModel, _super);
            function addressModel(firstName, surname) {
                _super.call(this);
                this.firstNames = firstName;
                this.surname = surname;
                this.address1 = null;
                this.address2 = null;
                this.city = null;
                this.postCode = null;
            }
            return addressModel;
        })(forms.model);
        booking.addressModel = addressModel;
        var observableAddressModel = (function (_super) {
            __extends(observableAddressModel, _super);
            function observableAddressModel(m) {
                _super.call(this);
                this.firstNames = ko.observable(m.firstNames);
                this.surname = ko.observable(m.surname);
                this.address1 = ko.observable(m.address1);
                this.address2 = ko.observable(m.address2);
                this.city = ko.observable(m.city);
                this.postCode = ko.observable(m.postCode);
                this.firstNames.extend({
                    required: { message: "One or more first names are required" }
                });
                this.surname.extend({
                    required: { message: "A surname is required" }
                });
                this.address1.extend({
                    required: { message: "An address line is required" }
                });
                this.city.extend({
                    required: { message: "A UK city is required" }
                });
                this.postCode.extend({
                    required: { message: "A UK post code in the standard format is required" }
                });
            }
            return observableAddressModel;
        })(forms.viewModel);
        booking.observableAddressModel = observableAddressModel;
    })(booking = fastnet.booking || (fastnet.booking = {}));
})(fastnet || (fastnet = {}));
