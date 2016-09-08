/// <reference path="../../../../fastnet.webframe.bookingdata/classes with typings/bookingStatus.cs.d.ts" />

module fastnet {
    export module booking {
        import forms = fastnet.forms;
        import str = fastnet.util.str;
        import h$ = fastnet.util.helper;
        export class bookingModel extends forms.model implements server.booking {
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
            partySize: number;
            totalCost: number;
            formattedCost: string;
            isPaid: boolean;
            canPay: boolean;
            notes: string;
            history: string;
            entryInformation: string;
            under18sInParty: boolean;
            numberOfNights: number;
            hasMultipleDays: boolean;
            description: string;
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
            partySize: number;
            formattedCost: string;
            isPaid: boolean;// KnockoutObservable<boolean>;
            notes: KnockoutObservable<string>;
            history: string;
            duration: string;
            //entryInformation: string;
            under18sInParty: boolean;
            description: string;
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
                this.partySize = b.partySize;
                this.description = b.description;
                this.under18sInParty = b.under18sInParty;
                this.formattedCost = b.formattedCost;
                this.isPaid = b.isPaid;// ko.observable(b.isPaid);
                this.notes = b.notes == null ? ko.observable('') : ko.observable(b.notes);
                this.history = b.history;
                this.duration = str.format("{0} for {1} night{2}", b.from, b.numberOfNights, b.numberOfNights > 1 ? "s" : "");
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
                    min: { params: 1, message: "The minumum duration is one day" }
                });
            }
            public canOpen(): boolean {
                return !this.isOpen();
            }
        }
        export class pricingModels extends forms.models {
            current: pricingModel;
            original: pricingModel;
        }
        export class pricingModel extends forms.model {
            public prices: server.pricing[];
            public minDate: moment.Moment;
            public newFrom: Date;
            public newAmount: number;
            constructor(minDate: moment.Moment, prices: server.pricing[]) {
                super();
                this.minDate = minDate;
                this.prices = [];
                prices.forEach((item, index, list) => {
                    var p: server.pricing = {
                        priceId: item.priceId,
                        amount: item.amount,
                        from: str.toDate(item.from),
                        isRolling: item.isRolling,
                        to: item.isRolling ? null : str.toDate(item.to)
                    };
                    this.prices.push(p);
                });
                //this.prices = prices;
            }
        }
        class observablePrice {
            priceId: number;
            amount: number;
            isRolling: boolean;
            from: Date;
            to: Date;
            canRemove: boolean;
        }
        export class observablePricingModel extends forms.viewModel {
            //public prices: server.pricing[];
            public prices: observablePrice[];
            public newFrom: KnockoutObservable<Date>;
            public newAmount: KnockoutObservable<number>;
            public minDate: moment.Moment;
            constructor(m: pricingModel) {
                super();
                this.prices = [];
                m.prices.forEach((item, index, list) => {
                    var p = new observablePrice();
                    p.priceId = item.priceId;
                    p.amount = item.amount;
                    p.from = item.from;
                    p.to = item.to;
                    p.isRolling = item.isRolling;
                    p.canRemove = false;
                    if (index !== list.length - 1) {
                        p.canRemove = true;
                    }
                    this.prices.push(p);
                });
                //this.prices = m.prices;
                this.minDate = m.minDate.add(-1, 'd');
                this.newFrom = ko.observable<Date>().extend({
                    required: { message: "A new price requires a date from which it applies" },
                    dateGreaterThan: { params: this.minDate, message: "Prices cannot be back dated"}
                });
                this.newAmount = ko.observable<number>().extend({
                    required: { message: "Enter a price (in pounds)" },
                    pattern: { params: /^[1-9][0-9]+$/, message: "The price (in pounds) must be a whole number and not start with 0"}
                });
            }
        }
        export class editTemplateModel extends forms.model {
            public availableTemplates: string[];
            public subjectText: string;
            public bodyHtml: string; 
            public selectedTemplate: string;
            constructor(templateList: string[]) {
                super();
                this.availableTemplates = templateList
                this.subjectText = "";
                this.bodyHtml = "";
            }
        }
        export class observableEditTemplateModel extends forms.viewModel {
            public availableTemplates: string[];
            public selectedTemplate: KnockoutObservable<string>;
            public subjectText: KnockoutObservable<string>;
            public bodyHtml: KnockoutObservable<string>;
            private currentTemplate: string = null;
            constructor(m: editTemplateModel) {
                super();
                this.availableTemplates = m.availableTemplates;
                this.subjectText = ko.observable(m.subjectText).extend({
                    required: {message: "some subject text is required"}
                });
                this.bodyHtml = ko.observable(m.bodyHtml).extend({
                    required: { message: "some email text is required" }
                });
                this.selectedTemplate = ko.observable<string>();
            }
            //public selectionChanged(element: HTMLElement) {
            //    if (this.selectedTemplate() !== undefined) {
            //        $(element).closest(".edit-email-template").find(".template-editor").removeClass("hidden");
            //    } else {
            //        $(element).closest(".edit-email-template").find(".template-editor").addClass("hidden");
            //    }
            //    //debugger;
            //}
        }
        export class editTemplateModels extends forms.models {
            current: editTemplateModel;
            original: editTemplateModel;
        }
    }
}