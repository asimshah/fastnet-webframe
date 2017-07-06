var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var fastnet;
(function (fastnet) {
    var booking;
    (function (booking) {
        var h$ = fastnet.util.helper;
        var dwhParameters = (function (_super) {
            __extends(dwhParameters, _super);
            function dwhParameters() {
                _super.apply(this, arguments);
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
                var _this = this;
                _super.call(this, model);
                this.__$className = "observableDwhParameters";
                this.privilegedMembers = null;
                this.paymentInterval = ko.observable(model.paymentInterval);
                this.entryCodeNotificationInterval = ko.observable(model.entryCodeNotificationInterval);
                this.entryCodeBridgeInterval = ko.observable(model.entryCodeBridgeInterval);
                this.cancellationInterval = ko.observable(model.cancellationInterval);
                this.firstReminderInterval = ko.observable(model.firstReminderInterval);
                this.secondReminderInterval = ko.observable(model.secondReminderInterval);
                this.reminderSuppressionInterval = ko.observable(model.reminderSuppressionInterval);
                if (!h$.isNullOrUndefined(model.privilegedMembers)) {
                    $.each(model.availableGroups, function (i, item) {
                        if (item.Id === model.privilegedMembers.Id) {
                            _this.privilegedMembers = ko.observable(model.availableGroups[i]);
                            return false;
                        }
                    });
                }
                else {
                    this.privilegedMembers = ko.observable();
                }
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
