var fastnet;
(function (fastnet) {
    var booking;
    (function (booking) {
        var FactoryName;
        (function (FactoryName) {
            FactoryName[FactoryName["None"] = 0] = "None";
            FactoryName[FactoryName["DonWhillansHut"] = 1] = "DonWhillansHut";
        })(FactoryName = booking.FactoryName || (booking.FactoryName = {}));
        var factory = (function () {
            function factory() {
            }
            factory.setFactory = function (name) {
                switch (name) {
                    case "DonWhillansHut":
                        factory.nameInternal = FactoryName.DonWhillansHut;
                        break;
                }
            };
            factory.getFactory = function () {
                return factory.nameInternal;
            };
            factory.getParameters = function (p) {
                //this.setFactory(p.factoryName);
                var bp = null;
                switch (factory.nameInternal) {
                    case FactoryName.DonWhillansHut:
                        bp = new booking.dwhParameters();
                        break;
                    default:
                        bp = new booking.parameters();
                        break;
                }
                bp.setFromJSON(p);
                return bp;
            };
            factory.getRequestCustomiser = function () {
                switch (factory.nameInternal) {
                    case FactoryName.DonWhillansHut:
                        return new booking.dwhRequestCustomiser();
                    //break;
                    default:
                        return new booking.requestCustomiser();
                }
            };
            factory.getObservableBookingModel = function (b) {
                switch (factory.nameInternal) {
                    case FactoryName.DonWhillansHut:
                        var dwhbm = b;
                        return new booking.observableDwhBookingModel(dwhbm);
                    //break;
                    default:
                        return new booking.observableBookingModel(b);
                }
            };
            factory.getCustomAdminIndex = function () {
                switch (factory.nameInternal) {
                    case FactoryName.DonWhillansHut:
                        return new booking.dwhAdminIndex();
                    //break;
                    default:
                        return null;
                }
            };
            return factory;
        }());
        // NB DO NOT use "name" as it has a special use in javascript
        factory.nameInternal = FactoryName.None;
        booking.factory = factory;
    })(booking = fastnet.booking || (fastnet.booking = {}));
})(fastnet || (fastnet = {}));
//# sourceMappingURL=factory.js.map