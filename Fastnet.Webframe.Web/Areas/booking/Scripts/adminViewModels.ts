/// <reference path="../../../../fastnet.webframe.bookingdata/classes with typings/bookingStatus.cs.d.ts" />
module fastnet {
    export module booking {
        import forms = fastnet.forms;
        import str = fastnet.util.str;
        import h$ = fastnet.util.helper;
        export class bookingModel extends forms.model implements server.booking  {
            bookingId: number;
            reference: string;
            status: server.bookingStatus;
            statusName: string;
            memberId: string;
            memberName: string;
            memberEmailAddress: string;
            memberPhoneNumber: string;
            from: string;
            to: string;
            createdOn: string;
            totalCost: number;
            formattedCost: string;
            isPaid: boolean;
            notes: string;
            history: string;
            entryInformation: string;
            under18sInParty: boolean;
            numberOfNights: number;
            hasMultipleDays: boolean;
        }
        export class observableBookingModel extends forms.viewModel {
            public bookingId: number;
            public reference: string;
            status: server.bookingStatus;
            statusName: string;
            memberId: string;
            memberName: string;
            memberEmailAddress: string;
            memberPhoneNumber: KnockoutObservable<string>;
            from: string;
            to: string;
            createdOn: string;
            //totalCost: number;
            formattedCost: string;
            isPaid: boolean;// KnockoutObservable<boolean>;
            notes: KnockoutObservable<string>;
            history: string;
            duration: string;
            //entryInformation: string;
            //under18sInParty: boolean;
            //numberOfNights: number;
            //hasMultipleDays: boolean;
            constructor(b: bookingModel) {
                super();
                this.bookingId = b.bookingId;
                this.reference = b.reference;
                this.status = b.status;
                this.statusName = b.statusName;
                this.memberId = b.memberId;
                this.memberName = b.memberName;
                this.memberEmailAddress = b.memberEmailAddress;
                this.memberPhoneNumber = ko.observable<string>(b.memberPhoneNumber).extend({
                    required: { message: "A mobile number is required" },
                    phoneNumber: true
                });
                this.from = b.from;
                this.to = b.to;
                this.createdOn = b.createdOn;
                this.formattedCost = b.formattedCost;
                this.isPaid = b.isPaid;// ko.observable(b.isPaid);
                this.notes = b.notes == null ? ko.observable('') : ko.observable(b.notes);
                this.history = b.history;
                this.duration = str.format("{0} for {1} night{2}", b.to, b.numberOfNights, b.numberOfNights > 1? "s" : "");
            }
        }
        export class bookingModels extends forms.models {
            current: bookingModel;
            original: bookingModel;
        }
        export class manageDaysModels extends forms.models {
            current: manageDaysModel;
            original: manageDaysModel;
        }
        export class manageDaysModel extends forms.model {
            //private data: server.bookingAvailability;
            public isOpen: boolean;
            public blockedPeriods: server.blockedPeriod[];
            public newPeriodFrom: Date;
            public newPeriodDuration: number;
            public newPeriodRemarks: string;
            constructor(d: server.bookingAvailability) {
                super();
                //this.data = d;
                this.isOpen = d.bookingOpen;
                this.blockedPeriods = d.blockedPeriods;
            }
            //public get bookingOpen() {
            //    return this.data.bookingOpen;
            //}
            //public get blockedPeriods() {
            //    return this.data.blockedPeriods;
            //}
        }
        class observableBlockedPeriod {
            availabilityId: number;
            startsOn: Date;
            endsOn: Date;
            remarks: string;
            constructor(bp: server.blockedPeriod) {
                this.availabilityId = bp.availabilityId;
                this.startsOn = bp.startsOn;
                this.endsOn = bp.endsOn;
                this.remarks = bp.remarks;
            }
        }
        export class observableManageDaysModel extends forms.viewModel {
            public isOpen: KnockoutObservable<boolean>;
            public blockedPeriods: observableBlockedPeriod[];
            public newPeriodFrom: KnockoutObservable<Date>;
            public newPeriodDuration: KnockoutObservable<number>;
            public newPeriodRemarks: KnockoutObservable<string>;

            constructor(m: manageDaysModel) {
                super();
                this.isOpen = ko.observable<boolean>(m.isOpen);
                this.blockedPeriods = [];
                m.blockedPeriods.forEach((bp: server.blockedPeriod, index: number, list: server.blockedPeriod[]) => {
                    this.blockedPeriods.push(new observableBlockedPeriod(bp));
                });
                this.newPeriodFrom = ko.observable<Date>()
                    .extend({
                        required: { message: "A starting date is required." }
                    });
                this.newPeriodRemarks = ko.observable<string>();
                this.newPeriodDuration = ko.observable<number>().extend({
                    required: { message: "Please provide a duration (in days) for the new blocked period" },
                    min: { params: 1, message: "The minumum duration is one day"}
                });
                //this.proposedPeriod = ko.computed<server.blockedPeriod>(() => {
                //    if (this.newPeriodDuration.isValid() && this.newPeriodDuration.isValid()) {
                //        var endsOn = moment(this.newPeriodFrom()).add(this.newPeriodDuration() - 1, 'd').toDate()
                //        var pp: server.blockedPeriod = {
                //            availabilityId: 0,
                //            startsOn: this.newPeriodFrom(),
                //            endsOn: endsOn,
                //            remarks: null
                //        }
                //        return pp;
                //    } else {
                //        return null;
                //    }
                //}).extend({ notOverlapped: { message: "hello" } });
                //this.dummy = ko.computed<observableManageDaysModel>(() => {
                //    return this;
                //}).extend({ notOverlapped: { message: "hello" } });
            }
            public canOpen(): boolean {
                return !this.isOpen();
            }
        }
    }
}