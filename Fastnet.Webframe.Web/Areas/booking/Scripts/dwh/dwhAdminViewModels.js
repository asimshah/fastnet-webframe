var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var fastnet;
(function (fastnet) {
    var booking;
    (function (booking) {
        var str = fastnet.util.str;
        var dwhBookingModel = (function (_super) {
            __extends(dwhBookingModel, _super);
            function dwhBookingModel() {
                _super.apply(this, arguments);
            }
            return dwhBookingModel;
        }(booking.bookingModel));
        booking.dwhBookingModel = dwhBookingModel;
        var observableDwhBookingModel = (function (_super) {
            __extends(observableDwhBookingModel, _super);
            function observableDwhBookingModel(dwhb) {
                _super.call(this, dwhb);
                this.bmcMembership = dwhb.bmcMembership;
                this.organisation = dwhb.organisation;
            }
            return observableDwhBookingModel;
        }(booking.observableBookingModel));
        booking.observableDwhBookingModel = observableDwhBookingModel;
        var entryCodeModels = (function (_super) {
            __extends(entryCodeModels, _super);
            function entryCodeModels() {
                _super.apply(this, arguments);
            }
            return entryCodeModels;
        }(fastnet.forms.models));
        booking.entryCodeModels = entryCodeModels;
        var entryCodeModel = (function (_super) {
            __extends(entryCodeModel, _super);
            function entryCodeModel(info) {
                _super.call(this);
                this.codeList = info.allCodes;
                this.currentEntryCode = info.currentEntryCode.code;
                this.validTo = str.toDateString(info.validTo);
            }
            return entryCodeModel;
        }(fastnet.forms.model));
        booking.entryCodeModel = entryCodeModel;
        var observableEntryCodeModel = (function (_super) {
            __extends(observableEntryCodeModel, _super);
            function observableEntryCodeModel(m) {
                _super.call(this);
                this.codeList = m.codeList;
                this.currentEntryCode = m.currentEntryCode;
                this.validTo = m.validTo;
                this.newCode = ko.observable(m.newCode)
                    .extend({
                    required: { message: "An entry code is required." }
                });
                this.applicableFrom = ko.observable()
                    .extend({
                    required: { message: "Every code requires a date from which it applies." }
                });
            }
            return observableEntryCodeModel;
        }(fastnet.forms.viewModel));
        booking.observableEntryCodeModel = observableEntryCodeModel;
    })(booking = fastnet.booking || (fastnet.booking = {}));
})(fastnet || (fastnet = {}));
//# sourceMappingURL=dwhAdminViewModels.js.map