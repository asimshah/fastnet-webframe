module fastnet {
    export module booking {
        import str = fastnet.util.str;
        import h$ = fastnet.util.helper;
        export class dwhBookingModel extends bookingModel implements server.dwhBooking {
            bmcMembership: string;
            organisation: string;
            memberIsPrivileged: boolean;
        }
        export class observableDwhBookingModel extends observableBookingModel {
            bmcMembership: string;
            organisation: string;
            constructor(dwhb: dwhBookingModel) {
                super(dwhb);
                this.bmcMembership = dwhb.bmcMembership;
                this.organisation = dwhb.organisation;
            }
        }
        export class entryCodeModels extends forms.models {
            current: entryCodeModel;
            original: entryCodeModel;
        }
        export class entryCodeModel extends forms.model {
            public codeList: server.entryCode[];
            public currentEntryCode: string;
            public validTo: string;
            public newCode: string;
            public applicableFrom: Date;
            constructor(info: entryCodeInfo) {
                super();
                this.codeList = info.allCodes;
                this.currentEntryCode = info.currentEntryCode.code;
                this.validTo = str.toDateString(info.validTo);
            }
        }
        export class observableEntryCodeModel extends forms.viewModel {
            public codeList: server.entryCode[];
            public currentEntryCode: string;
            public validTo: string;
            public newCode: KnockoutObservable<string>;
            public applicableFrom: KnockoutObservable<Date>;
            constructor(m: entryCodeModel) {
                super();
                this.codeList = m.codeList;
                this.currentEntryCode = m.currentEntryCode;
                this.validTo = m.validTo;
                this.newCode = ko.observable<string>(m.newCode)
                    .extend({
                        required: { message: "An entry code is required." }
                    });
                this.applicableFrom = ko.observable<Date>()
                    .extend({
                        required: { message: "Every code requires a date from which it applies." }
                    });
            }
        }
    }
}