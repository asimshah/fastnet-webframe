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
            //public static getAdminParameters(): admin.parameters {
            //    switch (factory.name) {
            //        case FactoryName.DonWhillansHut:
            //            return new admin.dwhParameters();
            //    }
            //    return new admin.parameters();
            //}
            factory.getParameters = function (p) {
                this.setFactory(p.factoryName);
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
            factory.name = FactoryName.None;
            return factory;
        })();
        booking.factory = factory;
    })(booking = fastnet.booking || (fastnet.booking = {}));
})(fastnet || (fastnet = {}));
//# sourceMappingURL=factory.js.map