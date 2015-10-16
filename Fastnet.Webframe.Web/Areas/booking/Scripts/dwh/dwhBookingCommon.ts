module fastnet {
    export module booking {
        import h$ = fastnet.util.helper;
        export class dwhParameters extends parameters {
            public noBMCCheckGroup: server.IGroup;
            public shortBookingInterval: number;
            public getObservable(): observableDwhParameters {
                return new observableDwhParameters(this);
            }
        }
        export class observableDwhParameters extends observableParameters {
            public noBMCCheckGroup: KnockoutObservable<server.IGroup> = null;
            public shortBookingInterval: KnockoutObservable<number>;
            public clearNoBMCCheckGroup(): void {
                this.noBMCCheckGroup(null);
                this.message("");
            }
            public selectionChanged() {
                this.message("");
            }
            constructor(model: dwhParameters) {
                super(model);
                this.shortBookingInterval = ko.observable(model.shortBookingInterval);
                if (!h$.isNullOrUndefined(model.noBMCCheckGroup)) {
                    $.each(model.availableGroups, (i, item) => {
                        if (item.Id === model.noBMCCheckGroup.Id) {
                            this.noBMCCheckGroup = ko.observable<server.IGroup>(model.availableGroups[i]);
                            return false;
                        }
                    });
                } else {
                    this.noBMCCheckGroup = ko.observable<server.IGroup>();
                }
            }
        }
    }
}