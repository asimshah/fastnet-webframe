
module fastnet {
    export module booking {
        import forms = fastnet.forms;
        import str = fastnet.util.str;
        import h$ = fastnet.util.helper;
        export class bookingModel extends forms.model implements server.booking  {
            bookingId: number;
            reference: string;
            status: string;
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
            status: string;
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
    }
}