module fastnet {
    export module booking {
        import h$ = fastnet.util.helper;
        export class dwhParameters extends parameters {
            public privilegedMembers: server.IGroup;
            public paymentInterval: number;
            public entryCodeNotificationInterval: number;
            public entryCodeBridgeInterval: number;
            public cancellationInterval: number;
            public firstReminderInterval: number;
            public secondReminderInterval: number;
            public reminderSuppressionInterval: number;
            public getObservable(): observableDwhParameters {
                return new observableDwhParameters(this);
            }
        }
        export class observableDwhParameters extends observableParameters {
            public __$className: string = "observableDwhParameters";
            public privilegedMembers: KnockoutObservable<server.IGroup> = null;
            public paymentInterval: KnockoutObservable<number>;
            public entryCodeNotificationInterval: KnockoutObservable<number>;
            public entryCodeBridgeInterval: KnockoutObservable<number>;
            public cancellationInterval: KnockoutObservable<number>;
            public firstReminderInterval: KnockoutObservable<number>;
            public secondReminderInterval: KnockoutObservable<number>;
            public reminderSuppressionInterval: KnockoutObservable<number>;
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
                this.cancellationInterval = ko.observable(model.cancellationInterval);
                this.firstReminderInterval = ko.observable(model.firstReminderInterval);
                this.secondReminderInterval = ko.observable(model.secondReminderInterval);
                this.reminderSuppressionInterval = ko.observable(model.reminderSuppressionInterval);
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