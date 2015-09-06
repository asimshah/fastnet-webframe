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
            public static getParametersVM(): adminVM.parameters {
                switch (factory.name) {
                    case FactoryName.DonWhillansHut:
                        return new adminVM.dwhParameters();
                }
                return new adminVM.parameters();
            }
        }

    }
}