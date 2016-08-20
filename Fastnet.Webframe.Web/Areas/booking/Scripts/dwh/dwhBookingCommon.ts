module fastnet {
    export module booking {
        import h$ = fastnet.util.helper;
        export class dwhParameters extends parameters {
            public privilegedMembers: server.IGroup;
            public paymentInterval: number;
            public entryCodeNotificationInterval: number;
            public entryCodeBridgeInterval: number;
            public getObservable(): observableDwhParameters {
                return new observableDwhParameters(this);
            }
        }
        export class observableDwhParameters extends observableParameters {
            public privilegedMembers: KnockoutObservable<server.IGroup> = null;
            public paymentInterval: KnockoutObservable<number>;
            public entryCodeNotificationInterval: KnockoutObservable<number>;
            public entryCodeBridgeInterval: KnockoutObservable<number>;
            public clearPrivilegedMembers(): void {
                this.privilegedMembers(null);
                this.message("");
            }
            public selectionChanged() {
                this.message("");
            }
            constructor(model: dwhParameters) {
                super(model);
                this.paymentInterval = ko.observable(model.paymentInterval);
                this.entryCodeNotificationInterval = ko.observable(model.entryCodeNotificationInterval);
                this.entryCodeBridgeInterval = ko.observable(model.entryCodeBridgeInterval);
                if (!h$.isNullOrUndefined(model.privilegedMembers)) {
                    $.each(model.availableGroups, (i, item) => {
                        if (item.Id === model.privilegedMembers.Id) {
                            this.privilegedMembers = ko.observable<server.IGroup>(model.availableGroups[i]);
                            return false;
                        }
                    });
                } else {
                    this.privilegedMembers = ko.observable<server.IGroup>();
                }
            }
        }
    }
}