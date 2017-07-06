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
        var str = fastnet.util.str;
        var dwhBookingModel = (function (_super) {
            __extends(dwhBookingModel, _super);
            function dwhBookingModel() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return dwhBookingModel;
        }(booking.bookingModel));
        booking.dwhBookingModel = dwhBookingModel;
        var observableDwhBookingModel = (function (_super) {
            __extends(observableDwhBookingModel, _super);
            function observableDwhBookingModel(dwhb) {
                var _this = _super.call(this, dwhb) || this;
                _this.bmcMembership = dwhb.bmcMembership;
                _this.organisation = dwhb.organisation;
                return _this;
            }
            return observableDwhBookingModel;
        }(booking.observableBookingModel));
        booking.observableDwhBookingModel = observableDwhBookingModel;
        var entryCodeModels = (function (_super) {
            __extends(entryCodeModels, _super);
            function entryCodeModels() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return entryCodeModels;
        }(fastnet.forms.models));
        booking.entryCodeModels = entryCodeModels;
        var entryCodeModel = (function (_super) {
            __extends(entryCodeModel, _super);
            function entryCodeModel(info) {
                var _this = _super.call(this) || this;
                _this.codeList = info.allCodes;
                _this.currentEntryCode = info.currentEntryCode.code;
                _this.validTo = str.toDateString(info.validTo);
                return _this;
            }
            return entryCodeModel;
        }(fastnet.forms.model));
        booking.entryCodeModel = entryCodeModel;
        var observableEntryCodeModel = (function (_super) {
            __extends(observableEntryCodeModel, _super);
            function observableEntryCodeModel(m) {
                var _this = _super.call(this) || this;
                _this.codeList = m.codeList;
                _this.currentEntryCode = m.currentEntryCode;
                _this.validTo = m.validTo;
                _this.newCode = ko.observable(m.newCode)
                    .extend({
                    required: { message: "An entry code is required." }
                });
                _this.applicableFrom = ko.observable()
                    .extend({
                    required: { message: "Every code requires a date from which it applies." }
                });
                return _this;
            }
            return observableEntryCodeModel;
        }(fastnet.forms.viewModel));
        booking.observableEntryCodeModel = observableEntryCodeModel;
    })(booking = fastnet.booking || (fastnet.booking = {}));
})(fastnet || (fastnet = {}));
//# sourceMappingURL=dwhAdminViewModels.js.map