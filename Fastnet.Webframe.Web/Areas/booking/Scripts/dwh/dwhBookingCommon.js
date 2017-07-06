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
        var h$ = fastnet.util.helper;
        var dwhParameters = (function (_super) {
            __extends(dwhParameters, _super);
            function dwhParameters() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            dwhParameters.prototype.getObservable = function () {
                return new observableDwhParameters(this);
            };
            return dwhParameters;
        }(booking.parameters));
        booking.dwhParameters = dwhParameters;
        var observableDwhParameters = (function (_super) {
            __extends(observableDwhParameters, _super);
            function observableDwhParameters(model) {
                var _this = _super.call(this, model) || this;
                _this.__$className = "observableDwhParameters";
                _this.privilegedMembers = null;
                _this.paymentInterval = ko.observable(model.paymentInterval);
                _this.entryCodeNotificationInterval = ko.observable(model.entryCodeNotificationInterval);
                _this.entryCodeBridgeInterval = ko.observable(model.entryCodeBridgeInterval);
                _this.cancellationInterval = ko.observable(model.cancellationInterval);
                _this.firstReminderInterval = ko.observable(model.firstReminderInterval);
                _this.secondReminderInterval = ko.observable(model.secondReminderInterval);
                _this.reminderSuppressionInterval = ko.observable(model.reminderSuppressionInterval);
                if (!h$.isNullOrUndefined(model.privilegedMembers)) {
                    $.each(model.availableGroups, function (i, item) {
                        if (item.Id === model.privilegedMembers.Id) {
                            _this.privilegedMembers = ko.observable(model.availableGroups[i]);
                            return false;
                        }
                    });
                }
                else {
                    _this.privilegedMembers = ko.observable();
                }
                return _this;
            }
            observableDwhParameters.prototype.clearPrivilegedMembers = function () {
                this.privilegedMembers(null);
                this.message("");
            };
            observableDwhParameters.prototype.selectionChanged = function () {
                this.message("");
            };
            return observableDwhParameters;
        }(booking.observableParameters));
        booking.observableDwhParameters = observableDwhParameters;
    })(booking = fastnet.booking || (fastnet.booking = {}));
})(fastnet || (fastnet = {}));
//# sourceMappingURL=dwhBookingCommon.js.map