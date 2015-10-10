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
                this.memberId = b.memberId;
                this.memberName = b.memberName;
                this.memberEmailAddress = b.memberEmailAddress;
                this.memberPhoneNumber = ko.observable(b.memberPhoneNumber);
                this.from = b.from;
                this.to = b.to;
                this.createdOn = b.createdOn;
                this.formattedCost = b.formattedCost;
                this.isPaid = b.isPaid; // ko.observable(b.isPaid);
                this.notes = ko.observable(b.notes);
                this.duration = str.format("{0} for {1} night{2}", b.to, b.numberOfNights, b.numberOfNights > 1 ? "s" : "");
            }
            return observableBookingModel;
        })(forms.viewModel);
        booking.observableBookingModel = observableBookingModel;
    })(booking = fastnet.booking || (fastnet.booking = {}));
})(fastnet || (fastnet = {}));
