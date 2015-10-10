var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="dwh/dwhbooking.ts" />
var fastnet;
(function (fastnet) {
    var booking;
    (function (booking) {
        var forms = fastnet.forms;
        var observableBooking = (function (_super) {
            __extends(observableBooking, _super);
            function observableBooking(b) {
                _super.call(this);
                this.bookingId = b.bookingId;
                this.reference = b.reference;
            }
            return observableBooking;
        })(forms.viewModel);
        booking.observableBooking = observableBooking;
    })(booking = fastnet.booking || (fastnet.booking = {}));
})(fastnet || (fastnet = {}));
