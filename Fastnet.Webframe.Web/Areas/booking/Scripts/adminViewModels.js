var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="../../../../fastnet.webframe.bookingdata/classes with typings/bookingStatus.cs.d.ts" />
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
        })(forms.model);
        booking.bookingModel = bookingModel;
        var observableBookingModel = (function (_super) {
            __extends(observableBookingModel, _super);
            //entryInformation: string;
            //under18sInParty: boolean;
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
                this.formattedCost = b.formattedCost;
                this.isPaid = b.isPaid; // ko.observable(b.isPaid);
                this.notes = b.notes == null ? ko.observable('') : ko.observable(b.notes);
                this.history = b.history;
                this.duration = str.format("{0} for {1} night{2}", b.to, b.numberOfNights, b.numberOfNights > 1 ? "s" : "");
            }
            return observableBookingModel;
        })(forms.viewModel);
        booking.observableBookingModel = observableBookingModel;
        var bookingModels = (function (_super) {
            __extends(bookingModels, _super);
            function bookingModels() {
                _super.apply(this, arguments);
            }
            return bookingModels;
        })(forms.models);
        booking.bookingModels = bookingModels;
    })(booking = fastnet.booking || (fastnet.booking = {}));
})(fastnet || (fastnet = {}));
//# sourceMappingURL=adminViewModels.js.map