/// <reference path="../../../../fastnet.webframe.bookingdata/classes with typings/bookingStatus.cs.d.ts" />
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
        var bookingModel = (function (_super) {
            __extends(bookingModel, _super);
            function bookingModel() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return bookingModel;
        }(forms.model));
        booking.bookingModel = bookingModel;
        var observableBookingModel = (function (_super) {
            __extends(observableBookingModel, _super);
            //numberOfNights: number;
            //hasMultipleDays: boolean;
            function observableBookingModel(b) {
                var _this = _super.call(this) || this;
                _this.bookingId = b.bookingId;
                _this.reference = b.reference;
                _this.status = b.status;
                _this.statusName = b.statusName;
                _this.memberId = b.memberId;
                _this.memberName = b.memberName;
                _this.memberEmailAddress = b.memberEmailAddress;
                _this.memberPhoneNumber = ko.observable(b.memberPhoneNumber).extend({
                    required: { message: "A mobile number is required" },
                    phoneNumber: true
                });
                _this.from = b.from;
                _this.to = b.to;
                _this.createdOn = b.createdOn;
                _this.partySize = b.partySize;
                _this.description = b.description;
                _this.under18sInParty = b.under18sInParty;
                _this.formattedCost = b.formattedCost;
                _this.isPaid = b.isPaid; // ko.observable(b.isPaid);
                _this.notes = b.notes == null ? ko.observable('') : ko.observable(b.notes);
                _this.history = b.history;
                _this.duration = str.format("{0} for {1} night{2}", b.from, b.numberOfNights, b.numberOfNights > 1 ? "s" : "");
                return _this;
            }
            return observableBookingModel;
        }(forms.viewModel));
        booking.observableBookingModel = observableBookingModel;
        var bookingModels = (function (_super) {
            __extends(bookingModels, _super);
            function bookingModels() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return bookingModels;
        }(forms.models));
        booking.bookingModels = bookingModels;
        var manageDaysModels = (function (_super) {
            __extends(manageDaysModels, _super);
            function manageDaysModels() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return manageDaysModels;
        }(forms.models));
        booking.manageDaysModels = manageDaysModels;
        var manageDaysModel = (function (_super) {
            __extends(manageDaysModel, _super);
            function manageDaysModel(d) {
                var _this = _super.call(this) || this;
                //this.data = d;
                _this.isOpen = d.bookingOpen;
                _this.blockedPeriods = d.blockedPeriods;
                return _this;
            }
            return manageDaysModel;
        }(forms.model));
        booking.manageDaysModel = manageDaysModel;
        var observableBlockedPeriod = (function () {
            function observableBlockedPeriod(bp) {
                this.availabilityId = bp.availabilityId;
                this.startsOn = bp.startsOn;
                this.endsOn = bp.endsOn;
                this.remarks = bp.remarks;
            }
            return observableBlockedPeriod;
        }());
        var observableManageDaysModel = (function (_super) {
            __extends(observableManageDaysModel, _super);
            function observableManageDaysModel(m) {
                var _this = _super.call(this) || this;
                _this.isOpen = ko.observable(m.isOpen);
                _this.blockedPeriods = [];
                m.blockedPeriods.forEach(function (bp, index, list) {
                    _this.blockedPeriods.push(new observableBlockedPeriod(bp));
                });
                _this.newPeriodFrom = ko.observable()
                    .extend({
                    required: { message: "A starting date is required." }
                });
                _this.newPeriodRemarks = ko.observable();
                _this.newPeriodDuration = ko.observable().extend({
                    required: { message: "Please provide a duration (in days) for the new blocked period" },
                    min: { params: 1, message: "The minumum duration is one day" }
                });
                return _this;
            }
            observableManageDaysModel.prototype.canOpen = function () {
                return !this.isOpen();
            };
            return observableManageDaysModel;
        }(forms.viewModel));
        booking.observableManageDaysModel = observableManageDaysModel;
        var pricingModels = (function (_super) {
            __extends(pricingModels, _super);
            function pricingModels() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return pricingModels;
        }(forms.models));
        booking.pricingModels = pricingModels;
        var pricingModel = (function (_super) {
            __extends(pricingModel, _super);
            function pricingModel(minDate, prices) {
                var _this = _super.call(this) || this;
                _this.minDate = minDate;
                _this.prices = [];
                prices.forEach(function (item, index, list) {
                    var p = {
                        priceId: item.priceId,
                        amount: item.amount,
                        from: str.toDate(item.from),
                        isRolling: item.isRolling,
                        to: item.isRolling ? null : str.toDate(item.to)
                    };
                    _this.prices.push(p);
                });
                return _this;
                //this.prices = prices;
            }
            return pricingModel;
        }(forms.model));
        booking.pricingModel = pricingModel;
        var observablePrice = (function () {
            function observablePrice() {
            }
            return observablePrice;
        }());
        var observablePricingModel = (function (_super) {
            __extends(observablePricingModel, _super);
            function observablePricingModel(m) {
                var _this = _super.call(this) || this;
                _this.prices = [];
                m.prices.forEach(function (item, index, list) {
                    var p = new observablePrice();
                    p.priceId = item.priceId;
                    p.amount = item.amount;
                    p.from = item.from;
                    p.to = item.to;
                    p.isRolling = item.isRolling;
                    p.canRemove = false;
                    if (index !== list.length - 1) {
                        p.canRemove = true;
                    }
                    _this.prices.push(p);
                });
                //this.prices = m.prices;
                _this.minDate = m.minDate.add(-1, 'd');
                _this.newFrom = ko.observable().extend({
                    required: { message: "A new price requires a date from which it applies" },
                    dateGreaterThan: { params: _this.minDate, message: "Prices cannot be back dated" }
                });
                _this.newAmount = ko.observable().extend({
                    required: { message: "Enter a price (in pounds)" },
                    pattern: { params: /^[1-9][0-9]+$/, message: "The price (in pounds) must be a whole number and not start with 0" }
                });
                return _this;
            }
            return observablePricingModel;
        }(forms.viewModel));
        booking.observablePricingModel = observablePricingModel;
        var editTemplateModel = (function (_super) {
            __extends(editTemplateModel, _super);
            function editTemplateModel(templateList) {
                var _this = _super.call(this) || this;
                _this.availableTemplates = templateList;
                _this.subjectText = "";
                _this.bodyHtml = "";
                return _this;
            }
            return editTemplateModel;
        }(forms.model));
        booking.editTemplateModel = editTemplateModel;
        var observableEditTemplateModel = (function (_super) {
            __extends(observableEditTemplateModel, _super);
            function observableEditTemplateModel(m) {
                var _this = _super.call(this) || this;
                _this.currentTemplate = null;
                _this.availableTemplates = m.availableTemplates;
                _this.subjectText = ko.observable(m.subjectText).extend({
                    required: { message: "some subject text is required" }
                });
                _this.bodyHtml = ko.observable(m.bodyHtml).extend({
                    required: { message: "some email text is required" }
                });
                _this.selectedTemplate = ko.observable();
                return _this;
            }
            return observableEditTemplateModel;
        }(forms.viewModel));
        booking.observableEditTemplateModel = observableEditTemplateModel;
        var editTemplateModels = (function (_super) {
            __extends(editTemplateModels, _super);
            function editTemplateModels() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return editTemplateModels;
        }(forms.models));
        booking.editTemplateModels = editTemplateModels;
    })(booking = fastnet.booking || (fastnet.booking = {}));
})(fastnet || (fastnet = {}));
//# sourceMappingURL=adminViewModels.js.map