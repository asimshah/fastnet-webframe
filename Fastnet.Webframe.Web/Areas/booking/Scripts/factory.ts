module fastnet {
    export module booking {
        export enum  FactoryName{
            None,
            DonWhillansHut = 1
        }
        export class factory {
            private static name: FactoryName = FactoryName.None;
            private static setFactory(name: string) {
                switch (name) {
                    case "DonWhillansHut":
                        factory.name = FactoryName.DonWhillansHut;
                        break;
                }
            }
            //public static getAdminParameters(): admin.parameters {
            //    switch (factory.name) {
            //        case FactoryName.DonWhillansHut:
            //            return new admin.dwhParameters();
            //    }
            //    return new admin.parameters();
            //}
            public static getParameters(p: server.bookingParameters): parameters {
                this.setFactory(p.factoryName);
                var bp: parameters = null;
                switch (factory.name) {
                    case FactoryName.DonWhillansHut:
                        bp = new dwhParameters();
                        break;
                    default:
                        bp = new parameters();
                        break;
                }
                bp.setFromJSON(p);
                return bp;
            }
        }

    }
}