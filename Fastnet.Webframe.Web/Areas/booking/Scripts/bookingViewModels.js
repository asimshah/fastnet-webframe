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
        var login;
        (function (login) {
            var loginModels = (function (_super) {
                __extends(loginModels, _super);
                function loginModels() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                return loginModels;
            }(forms.models));
            login.loginModels = loginModels;
            //export class credentials extends forms.viewModel {
            var credentials = (function (_super) {
                __extends(credentials, _super);
                function credentials() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                return credentials;
            }(forms.model));
            login.credentials = credentials;
            var observableCredentials = (function (_super) {
                __extends(observableCredentials, _super);
                function observableCredentials(m) {
                    var _this = _super.call(this) || this;
                    _this.email = ko.observable(m.email).extend({
                        required: { message: "An email address is required" }
                    });
                    _this.password = ko.observable().extend({
                        required: { message: "A password is required" }
                    });
                    return _this;
                }
                return observableCredentials;
            }(forms.viewModel));
            login.observableCredentials = observableCredentials;
        })(login = booking.login || (booking.login = {}));
        var step1Models = (function (_super) {
            __extends(step1Models, _super);
            function step1Models() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return step1Models;
        }(forms.models));
        booking.step1Models = step1Models;
        var request_step1 = (function (_super) {
            __extends(request_step1, _super);
            function request_step1(today, shortTermBookingAllowed, shortBookingInterval) {
                var _this = _super.call(this) || this;
                _this.startDate = null;
                _this.endDate = null;
                _this.numberOfPeople = null; //0;
                _this.today = today;
                _this.shortBookingInterval = shortBookingInterval;
                _this.shortTermBookingAllowed = shortTermBookingAllowed;
                return _this;
            }
            return request_step1;
        }(forms.model));
        booking.request_step1 = request_step1;
        var observableRequest_step1 = (function (_super) {
            __extends(observableRequest_step1, _super);
            function observableRequest_step1(m, opts) {
                var _this = _super.call(this) || this;
                _this.today = m.today;
                _this.shortBookingInterval = m.shortBookingInterval;
                _this.shortTermBookingAllowed = m.shortTermBookingAllowed;
                //if (!this.shortTermBookingAllowed) {
                //    var minStart = this.today.add(this.shortBookingInterval, 'd');
                //    var msg = str.format("Bookings need to be at least {0} days in advance, i.e. from {1}", this.shortBookingInterval, str.toDateString(minStart));
                //    this.startDate = ko.observable<Date>(m.startDate).extend({
                //        required: { message: "A start date is required" },
                //        dateGreaterThan: { params: minStart,  date: minStart, message: msg }
                //    });
                //} else {
                //    this.startDate = ko.observable<Date>(m.startDate).extend({
                //        required: { message: "An arrival date is required" },
                //    });
                //}
                _this.under18Present = ko.observable(false);
                _this.startDate = ko.observable(m.startDate);
                _this.under18Present.subscribe(function (val) {
                    ko.validation.validateObservable(_this.startDate);
                });
                _this.startDate.extend({
                    required: { message: "An arrival date is required" },
                    //bookingStartDate: { today: this.today, shortBookingInterval: this.shortBookingInterval, shortTermBookingAllowed: this.shortTermBookingAllowed, under18Present: this.under18Present }
                    bookingStartDate: { today: _this.today, todayString: str.toDateString(_this.today), shortBookingInterval: _this.shortBookingInterval, shortTermBookingAllowed: _this.shortTermBookingAllowed, under18Present: _this.under18Present }
                });
                _this.endDate = ko.observable(m.endDate).extend({
                    required: { message: "A departure date is required" },
                    bookingEndDate: { startDate: _this.startDate, fred: "asim" }
                });
                _this.startDate.subscribe(function (cd) {
                    var sdm = _this.toMoment(cd);
                    var edm = _this.toMoment(_this.endDate());
                    var duration = (edm === null) ? 0 : edm.diff(sdm, "days");
                    if (duration < 1) {
                        //edChangeFocusBlocked = true;
                        _this.endDate(sdm.add(1, 'd').toDate());
                        //edChangeFocusBlocked = false;
                    }
                }, _this);
                _this.numberOfPeople = ko.observable(m.numberOfPeople).extend({
                    required: { message: "Please provide the number of people in the party" },
                    min: { params: 1, message: "The number of people must be at least 1" },
                    max: {
                        params: opts.maximumNumberOfPeople,
                        message: str.format("The maximum number of people that can be acommodated is {0}", opts.maximumNumberOfPeople)
                    }
                });
                _this.mobileNumber = ko.observable(m.mobileNumber).extend({
                    required: { message: "Please provide a mobile number" },
                    phoneNumber: true
                });
                _this.helpText = function () {
                    return this.getHelpText();
                };
                //var tester = factory.getTest();
                var customiser = booking.factory.getRequestCustomiser();
                customiser.customise_Step1(_this);
                return _this;
            }
            observableRequest_step1.prototype.toMoment = function (d) {
                if (h$.isNullOrUndefined(d)) {
                    return null;
                }
                else {
                    return str.toMoment(d);
                    //return moment(d);
                }
            };
            observableRequest_step1.prototype.reset = function () {
                this.startDate(null);
                this.startDate.isModified(false);
                this.endDate(null);
                this.endDate.isModified(false);
                this.numberOfPeople(null);
                this.numberOfPeople.isModified(false);
                this.under18Present(false);
            };
            observableRequest_step1.prototype.getHelpText = function () {
                var sdm = this.toMoment(this.startDate());
                var edm = this.toMoment(this.endDate());
                var people = this.numberOfPeople();
                var duration = sdm === null || edm === null || h$.isNullOrUndefined(people) ? 0 : edm.diff(sdm, 'd');
                if (duration > 0) {
                    return str.format("Request is for {0} {2} for {1} {3}", people, duration, people === 1 ? "person" : "people", duration === 1 ? "night" : "nights");
                }
                else {
                    return "";
                }
            };
            return observableRequest_step1;
        }(forms.viewModel));
        booking.observableRequest_step1 = observableRequest_step1;
        //
        //
        var step2Models = (function (_super) {
            __extends(step2Models, _super);
            function step2Models() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return step2Models;
        }(forms.models));
        booking.step2Models = step2Models;
        var request_step2 = (function (_super) {
            __extends(request_step2, _super);
            function request_step2() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return request_step2;
        }(forms.model));
        booking.request_step2 = request_step2;
        var observableBookingChoice = (function (_super) {
            __extends(observableBookingChoice, _super);
            function observableBookingChoice(m) {
                var _this = _super.call(this) || this;
                _this.choiceNumber = m.choiceNumber;
                _this.totalCost = m.totalCost;
                _this.formattedCost = accounting.formatMoney(_this.totalCost, "£", 0, ",", ".", "%s%v");
                _this.description = m.description;
                return _this;
            }
            return observableBookingChoice;
        }(forms.viewModel));
        booking.observableBookingChoice = observableBookingChoice;
        var observableRequest_step2 = (function (_super) {
            __extends(observableRequest_step2, _super);
            function observableRequest_step2(m, fromDate, toDate, numberOfPeople, under18Present) {
                var _this = _super.call(this) || this;
                _this.fromDate = fromDate;
                _this.toDate = toDate;
                _this.numberOfPeople = numberOfPeople;
                _this.under18Present = under18Present;
                _this.choices = ko.observableArray();
                m.choices.forEach(function (o, i, arr) {
                    _this.choices.push(new observableBookingChoice(o));
                });
                // initially choose the first item in the array
                _this.selected = ko.observable(m.choices[0].choiceNumber);
                _this.announcement = str.format("From {0} to {1}, the following alternatives are available for {2} {3}:", _this.fromDate, _this.toDate, _this.numberOfPeople, _this.numberOfPeople === 1 ? "person" : "people");
                return _this;
            }
            return observableRequest_step2;
        }(forms.viewModel));
        booking.observableRequest_step2 = observableRequest_step2;
        var step3Models = (function (_super) {
            __extends(step3Models, _super);
            function step3Models() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return step3Models;
        }(forms.models));
        booking.step3Models = step3Models;
        var request_step3 = (function (_super) {
            __extends(request_step3, _super);
            function request_step3(fromDate, toDate, choice, tcLink, isShortTermBooking, shortTermBookingInterval, under18Present, phoneNumber, paymentGatewayAvailable, np) {
                var _this = _super.call(this) || this;
                _this.fromDate = fromDate;
                _this.toDate = toDate;
                _this.choice = choice;
                _this.under18Present = under18Present;
                _this.phoneNumber = phoneNumber;
                _this.tcLinkAvailable = tcLink !== null;
                _this.tcLink = tcLink;
                _this.isShortTermBooking = isShortTermBooking;
                _this.shortTermBookingInterval = shortTermBookingInterval;
                _this.paymentGatewayAvailable = paymentGatewayAvailable;
                _this.numberOfPeople = np;
                return _this;
            }
            return request_step3;
        }(forms.model));
        booking.request_step3 = request_step3;
        var observableRequest_step3 = (function (_super) {
            __extends(observableRequest_step3, _super);
            function observableRequest_step3(m) {
                var _this = _super.call(this) || this;
                _this.fromDate = str.toMoment(m.fromDate).format("ddd DDMMMYYYY");
                _this.toDate = str.toMoment(m.toDate).format("ddd DDMMMYYYY"); // m.toDate;
                _this.choice = m.choice;
                _this.choice.formattedCost = accounting.formatMoney(_this.choice.totalCost, "£", 0, ",", ".", "%s%v");
                _this.phoneNumber = m.phoneNumber;
                _this.under18Present = m.under18Present; // ko.observable(false);
                _this.tcLinkAvailable = m.tcLinkAvailable;
                _this.tcLink = m.tcLink;
                _this.tcAgreed = ko.observable(false).extend({
                    isChecked: { message: "Please confirm agreement with the Terms and Conditions" }
                });
                _this.isShortTermBooking = m.isShortTermBooking;
                _this.shortTermBookingInterval = m.shortTermBookingInterval;
                _this.paymentGatewayAvailable = m.paymentGatewayAvailable;
                _this.showPaymentRequiredMessage = m.paymentGatewayAvailable === true && m.isShortTermBooking;
                _this.numberOfPeople = m.numberOfPeople;
                return _this;
            }
            return observableRequest_step3;
        }(forms.viewModel));
        booking.observableRequest_step3 = observableRequest_step3;
        var observableMyBookingsModel = (function (_super) {
            __extends(observableMyBookingsModel, _super);
            function observableMyBookingsModel(bookings) {
                var _this = _super.call(this) || this;
                _this.bookings = bookings;
                _this.hasBookings = bookings.length > 0;
                return _this;
            }
            return observableMyBookingsModel;
        }(forms.viewModel));
        booking.observableMyBookingsModel = observableMyBookingsModel;
    })(booking = fastnet.booking || (fastnet.booking = {}));
})(fastnet || (fastnet = {}));
//# sourceMappingURL=bookingViewModels.js.map