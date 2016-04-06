module fastnet {
    export module booking {
        export enum  FactoryName{
            None,
            DonWhillansHut = 1
        }
        export class factory {
            private static name: FactoryName = FactoryName.None;
            public static setFactory(name: string) {
                switch (name) {
                    case "DonWhillansHut":
                        factory.name = FactoryName.DonWhillansHut;
                        break;
                }
            }
            public static getFactory(): FactoryName {
                return factory.name;
            }
            public static getParameters(p: server.bookingParameters): parameters {
                //this.setFactory(p.factoryName);
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
            public static getRequestCustomiser(): requestCustomiser {
                switch (factory.name) {
                    case  FactoryName.DonWhillansHut:
                        return new dwhRequestCustomiser();
                        //break;
                    default:
                        return new requestCustomiser();
                }
            }
            public static getObservableBookingModel(b: bookingModel | dwhBookingModel): observableBookingModel {
                switch (factory.name) {
                    case FactoryName.DonWhillansHut:
                        var dwhbm = <dwhBookingModel>b;
                        return new observableDwhBookingModel(dwhbm);
                        //break;
                    default:
                        return new observableBookingModel(b);
                }
            }
            public static getCustomAdminIndex(): adminCustomIndex {
                switch (factory.name) {
                    case FactoryName.DonWhillansHut:
                        return new dwhAdminIndex();
                        //break;
                    default:
                        return null;
                }
            }
        }

    }
}