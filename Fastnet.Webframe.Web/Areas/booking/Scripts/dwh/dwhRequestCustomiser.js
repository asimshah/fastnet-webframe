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
        var dwhRequestCustomiser = (function (_super) {
            __extends(dwhRequestCustomiser, _super);
            function dwhRequestCustomiser() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            dwhRequestCustomiser.prototype.customise_Step1 = function (stepObservable) {
                stepObservable.startDate.subscribe(function (sd) {
                    var sdm = stepObservable.toMoment(sd);
                    var edm = stepObservable.toMoment(stepObservable.endDate());
                    var duration = (edm === null) ? 0 : edm.diff(sdm, "days");
                    if (sdm !== null) {
                        var dayOfWeek = sdm.day();
                        if (dayOfWeek === 5 && duration < 2) {
                            //edChangeFocusBlocked = true;
                            stepObservable.endDate(sdm.add(2, 'd').toDate());
                            //edChangeFocusBlocked = false;
                        }
                    }
                });
            };
            return dwhRequestCustomiser;
        }(booking.requestCustomiser));
        booking.dwhRequestCustomiser = dwhRequestCustomiser;
    })(booking = fastnet.booking || (fastnet.booking = {}));
})(fastnet || (fastnet = {}));
//# sourceMappingURL=dwhRequestCustomiser.js.map