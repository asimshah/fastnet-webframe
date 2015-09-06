module fastnet {
    export module booking {
        export module adminVM {
            import h$ = fastnet.util.helper;
            export class dwhParameters extends parameters {
                public NoBMCCheckGroup: IGroup;
                public getObservable(): observableDwhParameters {
                    return new observableDwhParameters(this);
                }
            }
            export class observableDwhParameters extends observableParameters {
                public NoBMCCheckGroup: KnockoutObservable<IGroup> = null;
                public clearNoBMCCheckGroup(): void {
                    this.NoBMCCheckGroup(null);
                    this.message("");
                }
                public selectionChanged() {
                    this.message("");
                }
                constructor(model: dwhParameters) {
                    super(model);
                    if (!h$.isNullOrUndefined(model.NoBMCCheckGroup)) {
                        $.each(model.AvailableGroups, (i, item) => {
                            if (item.Id === model.NoBMCCheckGroup.Id) {
                                this.NoBMCCheckGroup = ko.observable<IGroup>(model.AvailableGroups[i]);
                                return false;
                            }
                        });
                    } else {
                        this.NoBMCCheckGroup = ko.observable<IGroup>();
                    }
                }
            }
        }
    }
}