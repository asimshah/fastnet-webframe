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
        //export interface IGroup {
        //    Id: number;
        //    Name: string;
        //}
        var login;
        (function (login) {
            var loginModels = (function (_super) {
                __extends(loginModels, _super);
                function loginModels() {
                    _super.apply(this, arguments);
                }
                return loginModels;
            })(forms.models);
            login.loginModels = loginModels;
            //export class credentials extends forms.viewModel {
            var credentials = (function (_super) {
                __extends(credentials, _super);
                function credentials() {
                    _super.apply(this, arguments);
                }
                return credentials;
            })(forms.model);
            login.credentials = credentials;
            var observableCredentials = (function (_super) {
                __extends(observableCredentials, _super);
                function observableCredentials(m) {
                    _super.call(this);
                    this.email = ko.observable(m.email).extend({
                        required: { message: "An email address is required" }
                    });
                    this.password = ko.observable().extend({
                        required: { message: "A password is required" }
                    });
                }
                return observableCredentials;
            })(forms.viewModel);
            login.observableCredentials = observableCredentials;
        })(login = booking.login || (booking.login = {}));
        var step1Models = (function (_super) {
            __extends(step1Models, _super);
            function step1Models() {
                _super.apply(this, arguments);
            }
            return step1Models;
        })(forms.models);
        booking.step1Models = step1Models;
        var request_step1 = (function (_super) {
            __extends(request_step1, _super);
            function request_step1(today, shortTermBookingAllowed, shortBookingInterval) {
                _super.call(this);
                this.startDate = null;
                this.endDate = null;
                this.numberOfPeople = null; //0;
                this.today = today;
                this.shortBookingInterval = shortBookingInterval;
                this.shortTermBookingAllowed = shortTermBookingAllowed;
            }
            return request_step1;
        })(forms.model);
        booking.request_step1 = request_step1;
        var observableRequest_step1 = (function (_super) {
            __extends(observableRequest_step1, _super);
            function observableRequest_step1(m, opts) {
                var _this = this;
                _super.call(this);
                this.today = m.today;
                this.shortBookingInterval = m.shortBookingInterval;
                this.shortTermBookingAllowed = m.shortTermBookingAllowed;
                if (!this.shortTermBookingAllowed) {
                    var minStart = this.today.add(this.shortBookingInterval, 'd');
                    var msg = str.format("Bookings need to be at least {0} days in advance, i.e. from {1}", this.shortBookingInterval, str.toDateString(minStart));
                    this.startDate = ko.observable(m.startDate).extend({
                        required: { message: "A start date is required" },
                        dateGreaterThan: { params: minStart, date: minStart, message: msg }
                    });
                }
                else {
                    this.startDate = ko.observable(m.startDate).extend({
                        required: { message: "An arrival date is required" },
                    });
                }
                this.endDate = ko.observable(m.endDate).extend({
                    required: { message: "A departure date is required" },
                    bookingEndDate: { startDate: this.startDate, fred: "asim" }
                });
                this.startDate.subscribe(function (cd) {
                    var sdm = _this.toMoment(cd);
                    var edm = _this.toMoment(_this.endDate());
                    var duration = (edm === null) ? 0 : edm.diff(sdm, "days");
                    if (duration < 1) {
                        //edChangeFocusBlocked = true;
                        _this.endDate(sdm.add(1, 'd').toDate());
                    }
                }, this);
                this.numberOfPeople = ko.observable(m.numberOfPeople).extend({
                    required: { message: "Please provide the number of people in the party" },
                    min: { params: 1, message: "The number of people must be at least 1" },
                    max: {
                        params: opts.maximumNumberOfPeople,
                        message: str.format("The maximum number of people that can be acommodated is {0}", opts.maximumNumberOfPeople)
                    }
                });
                this.mobileNumber = ko.observable(m.mobileNumber).extend({
                    required: { message: "Please provide a mobile number" },
                    phoneNumber: true
                });
                this.helpText = function () {
                    return this.getHelpText();
                };
                //var tester = factory.getTest();
                var customiser = booking.factory.getRequestCustomiser();
                customiser.customise_Step1(this);
            }
            observableRequest_step1.prototype.toMoment = function (d) {
                if (h$.isNullOrUndefined(d)) {
                    return null;
                }
                else {
                    return moment(d);
                }
            };
            observableRequest_step1.prototype.reset = function () {
                this.startDate(null);
                this.startDate.isModified(false);
                this.endDate(null);
                this.endDate.isModified(false);
                this.numberOfPeople(null);
                this.numberOfPeople.isModified(false);
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
        })(forms.viewModel);
        booking.observableRequest_step1 = observableRequest_step1;
        //
        //
        var step2Models = (function (_super) {
            __extends(step2Models, _super);
            function step2Models() {
                _super.apply(this, arguments);
            }
            return step2Models;
        })(forms.models);
        booking.step2Models = step2Models;
        var request_step2 = (function (_super) {
            __extends(request_step2, _super);
            function request_step2() {
                _super.apply(this, arguments);
            }
            return request_step2;
        })(forms.model);
        booking.request_step2 = request_step2;
        var observableBookingChoice = (function (_super) {
            __extends(observableBookingChoice, _super);
            function observableBookingChoice(m) {
                _super.call(this);
                this.choiceNumber = m.choiceNumber;
                this.totalCost = m.totalCost;
                this.formattedCost = accounting.formatMoney(this.totalCost, "£", 0, ",", ".", "%s%v");
                this.description = m.description;
            }
            return observableBookingChoice;
        })(forms.viewModel);
        booking.observableBookingChoice = observableBookingChoice;
        var observableRequest_step2 = (function (_super) {
            __extends(observableRequest_step2, _super);
            function observableRequest_step2(m, fromDate, toDate, numberOfPeople) {
                var _this = this;
                _super.call(this);
                this.fromDate = fromDate;
                this.toDate = toDate;
                this.numberOfPeople = numberOfPeople;
                this.choices = ko.observableArray();
                m.choices.forEach(function (o, i, arr) {
                    _this.choices.push(new observableBookingChoice(o));
                });
                // initially choose the first item in the array
                this.selected = ko.observable(m.choices[0].choiceNumber);
                this.announcement = str.format("From {0} to {1}, the following alternatives are available for {2} {3}:", this.fromDate, this.toDate, this.numberOfPeople, this.numberOfPeople === 1 ? "person" : "people");
            }
            return observableRequest_step2;
        })(forms.viewModel);
        booking.observableRequest_step2 = observableRequest_step2;
        var step3Models = (function (_super) {
            __extends(step3Models, _super);
            function step3Models() {
                _super.apply(this, arguments);
            }
            return step3Models;
        })(forms.models);
        booking.step3Models = step3Models;
        var request_step3 = (function (_super) {
            __extends(request_step3, _super);
            function request_step3(fromDate, toDate, choice, tcLink, isShortTermBooking, shortTermBookingInterval, paymentGatewayAvailable) {
                _super.call(this);
                this.fromDate = fromDate;
                this.toDate = toDate;
                this.choice = choice;
                //this.phoneNumber = phoneNumber;
                this.tcLinkAvailable = tcLink !== null;
                this.tcLink = tcLink;
                this.isShortTermBooking = isShortTermBooking;
                this.shortTermBookingInterval = shortTermBookingInterval;
                this.paymentGatewayAvailable = paymentGatewayAvailable;
            }
            return request_step3;
        })(forms.model);
        booking.request_step3 = request_step3;
        var observableRequest_step3 = (function (_super) {
            __extends(observableRequest_step3, _super);
            function observableRequest_step3(m) {
                _super.call(this);
                this.fromDate = str.toMoment(m.fromDate).format("ddd DDMMMYYYY");
                this.toDate = str.toMoment(m.toDate).format("ddd DDMMMYYYY"); // m.toDate;
                this.choice = m.choice;
                this.choice.formattedCost = accounting.formatMoney(this.choice.totalCost, "£", 0, ",", ".", "%s%v");
                //this.phoneNumber = ko.observable(m.phoneNumber);
                this.under18Present = ko.observable(false);
                this.tcLinkAvailable = m.tcLinkAvailable;
                this.tcLink = m.tcLink;
                this.tcAgreed = ko.observable(false).extend({
                    isChecked: { message: "Please confirm agreement with the Terms and Conditions" }
                });
                this.isShortTermBooking = m.isShortTermBooking;
                this.shortTermBookingInterval = m.shortTermBookingInterval;
                this.paymentGatewayAvailable = m.paymentGatewayAvailable;
                this.showPaymentRequiredMessage = m.paymentGatewayAvailable === true && m.isShortTermBooking;
            }
            return observableRequest_step3;
        })(forms.viewModel);
        booking.observableRequest_step3 = observableRequest_step3;
    })(booking = fastnet.booking || (fastnet.booking = {}));
})(fastnet || (fastnet = {}));
//# sourceMappingURL=bookingViewModels.js.map