module fastnet {
    export module booking {
        import h$ = fastnet.util.helper;
        export class dwhParameters extends parameters {
            public privilegedMembers: server.IGroup;
            public shortBookingInterval: number;
            public entryCodeNotificationPeriod: number;
            public entryCodeBridgePeriod: number;
            public getObservable(): observableDwhParameters {
                return new observableDwhParameters(this);
            }
        }
        export class observableDwhParameters extends observableParameters {
            public privilegedMembers: KnockoutObservable<server.IGroup> = null;
            public shortBookingInterval: KnockoutObservable<number>;
            public entryCodeNotificationPeriod: KnockoutObservable<number>;
            public entryCodeBridgePeriod: KnockoutObservable<number>;
            public clearPrivilegedMembers(): void {
                this.privilegedMembers(null);
                this.message("");
            }
            public selectionChanged() {
                this.message("");
            }
            constructor(model: dwhParameters) {
                super(model);
                this.shortBookingInterval = ko.observable(model.shortBookingInterval);
                this.entryCodeNotificationPeriod = ko.observable(model.entryCodeNotificationPeriod);
                this.entryCodeBridgePeriod = ko.observable(model.entryCodeBridgePeriod);
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