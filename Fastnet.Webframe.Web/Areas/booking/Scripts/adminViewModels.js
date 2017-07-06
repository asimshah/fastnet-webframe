/// <reference path="../../../../fastnet.webframe.bookingdata/classes with typings/bookingStatus.cs.d.ts" />
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
        var bookingModel = (function (_super) {
            __extends(bookingModel, _super);
            function bookingModel() {
                _super.apply(this, arguments);
            }
            return bookingModel;
        }(forms.model));
        booking.bookingModel = bookingModel;
        var observableBookingModel = (function (_super) {
            __extends(observableBookingModel, _super);
            //numberOfNights: number;
            //hasMultipleDays: boolean;
            function observableBookingModel(b) {
                _super.call(this);
                this.bookingId = b.bookingId;
                this.reference = b.reference;
                this.status = b.status;
                this.statusName = b.statusName;
                this.memberId = b.memberId;
                this.memberName = b.memberName;
                this.memberEmailAddress = b.memberEmailAddress;
                this.memberPhoneNumber = ko.observable(b.memberPhoneNumber).extend({
                    required: { message: "A mobile number is required" },
                    phoneNumber: true
                });
                this.from = b.from;
                this.to = b.to;
                this.createdOn = b.createdOn;
                this.partySize = b.partySize;
                this.description = b.description;
                this.under18sInParty = b.under18sInParty;
                this.formattedCost = b.formattedCost;
                this.isPaid = b.isPaid; // ko.observable(b.isPaid);
                this.notes = b.notes == null ? ko.observable('') : ko.observable(b.notes);
                this.history = b.history;
                this.duration = str.format("{0} for {1} night{2}", b.from, b.numberOfNights, b.numberOfNights > 1 ? "s" : "");
            }
            return observableBookingModel;
        }(forms.viewModel));
        booking.observableBookingModel = observableBookingModel;
        var bookingModels = (function (_super) {
            __extends(bookingModels, _super);
            function bookingModels() {
                _super.apply(this, arguments);
            }
            return bookingModels;
        }(forms.models));
        booking.bookingModels = bookingModels;
        var manageDaysModels = (function (_super) {
            __extends(manageDaysModels, _super);
            function manageDaysModels() {
                _super.apply(this, arguments);
            }
            return manageDaysModels;
        }(forms.models));
        booking.manageDaysModels = manageDaysModels;
        var manageDaysModel = (function (_super) {
            __extends(manageDaysModel, _super);
            function manageDaysModel(d) {
                _super.call(this);
                //this.data = d;
                this.isOpen = d.bookingOpen;
                this.blockedPeriods = d.blockedPeriods;
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
                var _this = this;
                _super.call(this);
                this.isOpen = ko.observable(m.isOpen);
                this.blockedPeriods = [];
                m.blockedPeriods.forEach(function (bp, index, list) {
                    _this.blockedPeriods.push(new observableBlockedPeriod(bp));
                });
                this.newPeriodFrom = ko.observable()
                    .extend({
                    required: { message: "A starting date is required." }
                });
                this.newPeriodRemarks = ko.observable();
                this.newPeriodDuration = ko.observable().extend({
                    required: { message: "Please provide a duration (in days) for the new blocked period" },
                    min: { params: 1, message: "The minumum duration is one day" }
                });
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
                _super.apply(this, arguments);
            }
            return pricingModels;
        }(forms.models));
        booking.pricingModels = pricingModels;
        var pricingModel = (function (_super) {
            __extends(pricingModel, _super);
            function pricingModel(minDate, prices) {
                var _this = this;
                _super.call(this);
                this.minDate = minDate;
                this.prices = [];
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
                var _this = this;
                _super.call(this);
                this.prices = [];
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
                this.minDate = m.minDate.add(-1, 'd');
                this.newFrom = ko.observable().extend({
                    required: { message: "A new price requires a date from which it applies" },
                    dateGreaterThan: { params: this.minDate, message: "Prices cannot be back dated" }
                });
                this.newAmount = ko.observable().extend({
                    required: { message: "Enter a price (in pounds)" },
                    pattern: { params: /^[1-9][0-9]+$/, message: "The price (in pounds) must be a whole number and not start with 0" }
                });
            }
            return observablePricingModel;
        }(forms.viewModel));
        booking.observablePricingModel = observablePricingModel;
        var editTemplateModel = (function (_super) {
            __extends(editTemplateModel, _super);
            function editTemplateModel(templateList) {
                _super.call(this);
                this.availableTemplates = templateList;
                this.subjectText = "";
                this.bodyHtml = "";
            }
            return editTemplateModel;
        }(forms.model));
        booking.editTemplateModel = editTemplateModel;
        var observableEditTemplateModel = (function (_super) {
            __extends(observableEditTemplateModel, _super);
            function observableEditTemplateModel(m) {
                _super.call(this);
                this.currentTemplate = null;
                this.availableTemplates = m.availableTemplates;
                this.subjectText = ko.observable(m.subjectText).extend({
                    required: { message: "some subject text is required" }
                });
                this.bodyHtml = ko.observable(m.bodyHtml).extend({
                    required: { message: "some email text is required" }
                });
                this.selectedTemplate = ko.observable();
            }
            return observableEditTemplateModel;
        }(forms.viewModel));
        booking.observableEditTemplateModel = observableEditTemplateModel;
        var editTemplateModels = (function (_super) {
            __extends(editTemplateModels, _super);
            function editTemplateModels() {
                _super.apply(this, arguments);
            }
            return editTemplateModels;
        }(forms.models));
        booking.editTemplateModels = editTemplateModels;
    })(booking = fastnet.booking || (fastnet.booking = {}));
})(fastnet || (fastnet = {}));
