var fastnet;
(function (fastnet) {
    var booking;
    (function (booking) {
        (function (FactoryName) {
            FactoryName[FactoryName["None"] = 0] = "None";
            FactoryName[FactoryName["DonWhillansHut"] = 1] = "DonWhillansHut";
        })(booking.FactoryName || (booking.FactoryName = {}));
        var FactoryName = booking.FactoryName;
        var factory = (function () {
            function factory() {
            }
            factory.setFactory = function (name) {
                switch (name) {
                    case "DonWhillansHut":
                        factory.name = FactoryName.DonWhillansHut;
                        break;
                }
            };
            factory.getFactory = function () {
                return factory.name;
            };
            factory.getParameters = function (p) {
                //this.setFactory(p.factoryName);
                var bp = null;
                switch (factory.name) {
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
                switch (factory.name) {
                    case FactoryName.DonWhillansHut:
                        return new booking.dwhRequestCustomiser();
                        break;
                    default:
                        return new booking.requestCustomiser();
                }
            };
            factory.getObservableBookingModel = function (b) {
                switch (factory.name) {
                    case FactoryName.DonWhillansHut:
                        var dwhbm = b;
                        return new booking.observableDwhBookingModel(dwhbm);
                        break;
                    default:
                        return new booking.observableBookingModel(b);
                }
            };
            factory.getCustomAdminIndex = function () {
                switch (factory.name) {
                    case FactoryName.DonWhillansHut:
                        return new booking.dwhAdminIndex();
                        break;
                    default:
                        return null;
                }
            };
            factory.name = FactoryName.None;
            return factory;
        })();
        booking.factory = factory;
    })(booking = fastnet.booking || (fastnet.booking = {}));
})(fastnet || (fastnet = {}));
//# sourceMappingURL=factory.js.map