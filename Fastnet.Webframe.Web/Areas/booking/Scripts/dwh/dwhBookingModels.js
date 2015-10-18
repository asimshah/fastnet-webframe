var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var fastnet;
(function (fastnet) {
    var booking;
    (function (booking) {
        //export class dwhParameters extends parameters {
        //    public noBMCCheckGroup: server.IGroup;
        //    public shortBookingInterval: number;
        //    public getObservable(): observableDwhParameters {
        //        return new observableDwhParameters(this);
        //    }
        //}
        //export class observableDwhParameters extends observableParameters {
        //    public noBMCCheckGroup: KnockoutObservable<server.IGroup> = null;
        //    public shortBookingInterval: KnockoutObservable<number>;
        //    public clearNoBMCCheckGroup(): void {
        //        this.noBMCCheckGroup(null);
        //        this.message("");
        //    }
        //    public selectionChanged() {
        //        this.message("");
        //    }
        //    constructor(model: dwhParameters) {
        //        super(model);
        //        this.shortBookingInterval = ko.observable(model.shortBookingInterval);
        //        if (!h$.isNullOrUndefined(model.noBMCCheckGroup)) {
        //            $.each(model.availableGroups, (i, item) => {
        //                if (item.Id === model.noBMCCheckGroup.Id) {
        //                    this.noBMCCheckGroup = ko.observable<server.IGroup>(model.availableGroups[i]);
        //                    return false;
        //                }
        //            });
        //        } else {
        //            this.noBMCCheckGroup = ko.observable<server.IGroup>();
        //        }
        //    }
        //}
        var dwhBookingModel = (function (_super) {
            __extends(dwhBookingModel, _super);
            function dwhBookingModel() {
                _super.apply(this, arguments);
            }
            return dwhBookingModel;
        })(booking.bookingModel);
        booking.dwhBookingModel = dwhBookingModel;
        var observableDwhBookingModel = (function (_super) {
            __extends(observableDwhBookingModel, _super);
            function observableDwhBookingModel(dwhb) {
                _super.call(this, dwhb);
                this.bmcMembership = dwhb.bmcMembership;
                this.organisation = dwhb.organisation;
            }
            return observableDwhBookingModel;
        })(booking.observableBookingModel);
        booking.observableDwhBookingModel = observableDwhBookingModel;
    })(booking = fastnet.booking || (fastnet.booking = {}));
})(fastnet || (fastnet = {}));
//# sourceMappingURL=dwhBookingModels.js.map