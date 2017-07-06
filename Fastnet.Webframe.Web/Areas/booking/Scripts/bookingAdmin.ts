/// <reference path="../../../scripts/typings/mustache/mustache.d.ts" />
/// <reference path="../../../scripts/typings/jquery.datatables/jquery.datatables.d.ts" />

module fastnet {
    import ajax = fastnet.util.ajax;
    import debug = fastnet.util.debug;
    import str = fastnet.util.str;
    import wt = fastnet.web.tools;
    import forms = fastnet.forms;
    import h$ = fastnet.util.helper;
    class configuration {

        public static getFormStyleClasses(): string[] {
            return ["report-forms"];
        }
    }
    export module booking {

        enum bookingReportType {
            normal,
            unpaid,
            archived,
            cancelled
        }
        export class adminApp {

            public parameters: parameters;// server.bookingParameters;// server.BookingParameters;
            public start(): void {
                this.initialise().then(() => {
                    var index = new adminIndex(this);
                    index.start();
                });
            }
            private initialise(): JQueryPromise<void> {
                var deferred = $.Deferred<void>();
                var config: forms.configuration = {
                    modelessContainer: "admin-interaction",
                    enableRichText: true,
                    richTextCssUrl: "../areas/booking/content/richtext.css",
                    additionalValidations: bookingAppValidations.GetValidators()
                };
                forms.form.initialise(config);
                var parametersUrl = "bookingapi/parameters";
                ajax.Get({ url: parametersUrl }, false).then((r: server.bookingParameters) => {
                    factory.setFactory(r.factoryName);
                    this.parameters = factory.getParameters(r);
                    //this.bookingParameters = <server.bookingParameters>r;
                    //factory.setFactory(this.bookingParameters.factoryName);// .FactoryName);
                    deferred.resolve();
                });
                return deferred.promise();
            }
        }
        export class adminSubapp {
            protected app: adminApp;
            constructor(app: adminApp) {
                this.app = app;
            }
        }
        export abstract class adminCustomIndex {
            public abstract handleCommand(parent: forms.form, app: adminApp, cmd: string): void;
        }
        export class adminIndex extends adminSubapp {
            //private app: adminApp;
            constructor(app: adminApp) {
                super(app);
                //this.app = app;
            }
            public start(): void {
                //debug.print("admin index started");
                var aiForm = new forms.form(this, {
                    modal: false,
                    title: "Booking Administration",
                    styleClasses: configuration.getFormStyleClasses(),
                    cancelButtonText: "Home page",
                    okButton: null
                }, null);
                var adminIndexFormTemplateUrl = "booking/adminIndex";
                wt.getTemplate({ ctx: this, templateUrl: adminIndexFormTemplateUrl }).then((r) => {
                    aiForm.setContentHtml(r.template);
                    aiForm.open((ctx: adminIndex, f: forms.form, cmd: string, data: any) => {
                        switch (cmd) {
                            case "cancel-command":
                                f.close();
                                location.href = "/home";
                                break;
                            case "edit-configuration":
                                f.close();
                                var ci = new configIndex(this.app);
                                ci.start();
                                break;
                            case "view-occupancy":
                                f.close();
                                var or = new occupancyReport(this.app);
                                or.start();
                                break;
                            case "view-bookings":
                                f.close();
                                var br = new bookingReport(this.app);
                                br.start();
                                break;
                            case "view-unpaid-bookings":
                                f.close();
                                var br = new bookingReport(this.app);
                                br.start(bookingReportType.unpaid);
                                break;
                            case "view-cancelled-bookings":
                                f.close();
                                var br = new bookingReport(this.app);
                                br.start(bookingReportType.cancelled);
                                break;
                            case "view-archived-bookings":
                                f.close();
                                var br = new bookingReport(this.app);
                                br.start(bookingReportType.archived);
                                break;
                            case "manage-booking-days":
                                f.close();
                                var md = new manageDays(this.app);
                                md.start();
                                break;
                            case "edit-pricing":
                                f.close();
                                var mp = new managePricing(this.app);
                                mp.start();
                                break;
                            //case "email-templates":
                            //    f.close();
                            //    var et = new emailTemplates(this.app);
                            //    et.start();
                            //    break;
                            default:
                                var ch = factory.getCustomAdminIndex();
                                if (ch != null && ch.handleCommand(f, this.app, cmd)) {
                                } else {
                                    forms.messageBox.show("This feature not yet implemented").then(() => { });
                                }
                                break;
                        }
                    });
                });
            }
        }
        class configIndex extends adminSubapp {
            constructor(app: adminApp) {
                super(app);
                //this.app = app;
            }
            public start(): void {
                //debug.print("configuration index started");
                var ciForm = new forms.form(this, {
                    modal: false,
                    title: "Booking Configuration",
                    styleClasses: configuration.getFormStyleClasses(),
                    cancelButtonText: "Administration page",
                    okButton: null,
                    additionalButtons: [
                        { text: "Home page", command: "back-to-site", position: forms.buttonPosition.left }
                    ]
                }, null);
                var configurationIndexFormTemplateUrl = "booking/configurationIndex";
                wt.getTemplate({ ctx: this, templateUrl: configurationIndexFormTemplateUrl }).then((r) => {
                    ciForm.setContentHtml(r.template);
                    ciForm.open((ctx: configIndex, f: forms.form, cmd: string, data: any) => {
                        switch (cmd) {
                            case "cancel-command":
                                f.close();
                                var index = new adminIndex(this.app);
                                index.start();
                                break;
                            case "back-to-site":
                                f.close();
                                location.href = "/home";
                                break;
                            case "edit-parameters":
                                f.close();
                                var pf = new parametersApp(this.app);
                                pf.start();
                                break;
                            case "edit-email-templates":
                                f.close();
                                var et = new emailTemplates(this.app);
                                et.start();
                                break;
                            default:
                                forms.messageBox.show("This feature not yet implemented").then(() => { });
                                break;
                        }
                    });
                });
            }
        }
        class parametersApp extends adminSubapp {
            constructor(app: adminApp) {
                super(app);
                //this.app = app;
            }
            public start(): void {
                //debug.print("parametersApp started");
                var url = "bookingapi/parameters";
                ajax.Get({ url: url }, false).then((r: server.bookingParameters) => {
                    try {
                        factory.setFactory(r.factoryName);
                        var model = factory.getParameters(r);
                        var vm = model.getObservable();
                        this.showForm(vm);
                    } catch (e) {
                        debugger;
                    }
                });
            }
            public showForm(vm: observableParameters) {
                var paraForm = new forms.form(this, {
                    modal: false,
                    title: "Parameters",
                    styleClasses: configuration.getFormStyleClasses(),
                    okButtonText: "Save changes",
                    cancelButton: null,
                    additionalButtons: [
                        { text: "Home page", command: "back-to-site", position: forms.buttonPosition.left },
                        { text: "Configuration page", command: "configuration-page", position: forms.buttonPosition.left }
                    ]
                }, vm);
                var configurationIndexFormTemplateUrl = "booking/parameters";
                wt.getTemplate({ ctx: this, templateUrl: configurationIndexFormTemplateUrl }).then((r) => {
                    paraForm.setContentHtml(r.template);
                    paraForm.open((ctx: configIndex, f: forms.form, cmd: string, data: parameterModels) => {
                        switch (cmd) {
                            case "configuration-page":
                                f.close();
                                var index = new configIndex(this.app);
                                index.start();
                                break;
                            case "back-to-site":
                                f.close();
                                location.href = "/home";
                                break;
                            case "ok-command":
                                this.saveParameters(f, data);
                                break;
                            default:
                                forms.messageBox.show("This feature not yet implemented");//.then(() => { });
                                break;
                        }
                    });
                });
            }
            public saveParameters(f: forms.form, models: parameterModels): void {
                var url = "bookingadmin/save/parameters";
                // **NB** I am forcing this code to assume that
                // the parameters are actually dwhParameters!!
                // I no longer believe that this code will be used for anything but DWH!
                var currentDWHParameters = <dwhParameters>models.current;
                var originalDWHParameters = <dwhParameters>models.original;
                if (currentDWHParameters.privilegedMembers === undefined) {
                    // why does this situation arise? currentDWHParameters.privilegedMembers only exists
                    // if the drop down was ussed to select a group (apparently!)
                    currentDWHParameters.privilegedMembers = originalDWHParameters.privilegedMembers;
                }
                ajax.Post({ url: url, data: models.current }).then((r) => {
                    f.setMessage("Changes saved");
                });
            }
        }
        //class blockedPeriodValidations {
        //    public static notOverlapped: forms.knockoutAsyncValidator = function (val, params, callback): void {
        //        //var value: server.blockedPeriod = val;
        //        //var from = str.toDateString(value.startsOn);
        //        //var to = str.toDateString(value.endsOn);
        //        //var abodeId = 0;//params.abodeId;
        //        //var url = str.format("bookingadmin/get/blockedperiod/{0}/isvalid/{1}/{2}", abodeId, from, to);
        //        //ajax.Get({ url: url }).then((r) => {
        //        //    callback({ isValid: r.Success, message: r.Error });
        //        //});
        //    }
        //    public static GetValidators() {
        //        var rules: any[] = [];
        //        rules.push({ name: "notOverlapped", async: true, validator: blockedPeriodValidations.notOverlapped, message: "This period overlaps with an existing blocked period" });
        //        return rules;
        //    }
        //}
        interface blockerPeriodSaveResult {
            success: boolean;
            message: string;
        }
        class managePricing extends adminSubapp {
            constructor(app: adminApp) {
                super(app);
            }
            public start(): void {
                this.showForm();
            }
            private showForm(): void {
                var url = str.format("bookingadmin/get/pricing/{0}", this.app.parameters.currentAbode.id);
                ajax.Get({ url: url }, false).then((r: server.pricing[]) => {
                    var today = str.toMoment(this.app.parameters.today);
                    var model = new pricingModel(today, r);
                    var vm = new observablePricingModel(model);
                    var templateUrl = "booking/pricing";
                    wt.getTemplate({ ctx: this, templateUrl: templateUrl }).then((r) => {
                        var f = new forms.form(this, {
                            modal: false,
                            title: "Manage Pricing",
                            styleClasses: ["report-forms"],
                            okButton: null,
                            cancelButtonText: "Administration page",
                            additionalButtons: [
                                { text: "Home page", command: "back-to-site", position: forms.buttonPosition.left }
                            ]
                        }, vm);
                        f.setContentHtml(r.template);
                        f.open((ctx: managePricing, f: forms.form, cmd: string, data: pricingModels, ct: EventTarget) => {
                            switch (cmd) {
                                case "remove-price":
                                    var id = parseInt($(ct).closest("tr").attr("data-id"));
                                    this.removePrice(id).then(() => {
                                        f.close();
                                        var mp = new managePricing(this.app);
                                        mp.start();
                                    });
                                    break;
                                case "add-new-price":
                                    if (f.isValid()) {
                                        this.addNewPrice(data.current).then(() => {
                                            f.close();
                                            var mp = new managePricing(this.app);
                                            mp.start();
                                        });
                                    }
                                    break;
                                case "cancel-command":
                                    f.close();
                                    var index = new adminIndex(this.app);
                                    index.start();
                                    break;
                                case "back-to-site":
                                    f.close();
                                    location.href = "/home";
                                    break;
                            }
                        });
                    });
                });
            }
            private removePrice(id: number): JQueryPromise<void> {
                var deferred = $.Deferred<void>();
                var abodeId = this.app.parameters.currentAbode.id;
                var url = str.format("bookingadmin/remove/pricing/{0}/{1}", abodeId, id);
                ajax.Post({ url: url, data: null }).then(() => {
                    deferred.resolve();
                });
                return deferred.promise();
            }
            private addNewPrice(m: pricingModel): JQueryPromise<void> {
                var deferred = $.Deferred<void>();
                var from = str.toDateString(m.newFrom);
                var amount = m.newAmount;
                var abodeId = this.app.parameters.currentAbode.id;
                var url = str.format("bookingadmin/add/pricing/{0}", abodeId);
                ajax.Post({ url: url, data: { from: from, amount: amount } }).then(() => {
                    deferred.resolve();
                });
                return deferred.promise();
            }
        }
        class manageDays extends adminSubapp {
            //private abodeId: number;
            private calendarPeriod: period;
            private today: Date;
            private vm: observableManageDaysModel;
            private dayDictionary: collections.Dictionary<string, server.dayInformation>;
            constructor(app: adminApp) {
                super(app);
            }
            public start(): void {
                this.dayDictionary = new collections.Dictionary<string, server.dayInformation>();
                //this.abodeId = this.app.parameters.currentAbode.id;
                this.calendarPeriod = { start: null, end: null };
                this.loadInitialisationData().then(() => {
                    // current period and all day status information has all been loaded
                    this.showForm();
                });
            }
            private addBookingCalendar(nm: number): number {
                $('#bookingCalendar').datepicker({
                    defaultDate: this.today,
                    numberOfMonths: nm, //4,
                    minDate: this.calendarPeriod.start,
                    maxDate: this.calendarPeriod.end,
                    beforeShowDay: (d) => { return this.calendarBeforeShowDate(d); },// this.calendarBeforeShowDate ,
                    //onChangeMonthYear: (m, y) => {
                    //    //this.calendarOnChangeMonth(m, y);
                    //},                    
                    //onSelect: this.BookingDateSelected,
                    dateFormat: 'DD d M yy'
                }).val('');
                window.onresize = (e) => {
                    this.setCalendarMonthCount();
                };
                return this.setCalendarMonthCount();
            }
            public calendarBeforeShowDate(d): any[] {
                var day: moment.Moment = moment(d);
                if (day.isBefore(this.calendarPeriod.start) || day.isAfter(this.calendarPeriod.end)) {
                    return [false, "blocked", "Out of range"];
                }
                if (this.dayDictionary.isEmpty()) {
                    return [false, "blocked", "not ready"];
                } else {
                    if (this.dayDictionary.containsKey(str.toDateString(day))) {
                        var di = this.dayDictionary.getValue(str.toDateString(day));
                        var r: any[];
                        switch (di.status) {
                            case server.DayStatus.IsClosed:
                                r = [false, "out-of-service", di.calendarPopup];
                                break;
                            case server.DayStatus.IsFull:
                                r = [false, "fully-booked", di.calendarPopup];
                                break;
                            case server.DayStatus.IsNotBookable:
                                r = [false, "not-bookable", di.calendarPopup];
                                break;
                            case server.DayStatus.IsPartBooked:
                                r = [true, "part-booked", di.calendarPopup];
                                break;
                            case server.DayStatus.IsFree:
                                r = [true, "free", di.calendarPopup];
                                break;
                        }
                        return r;

                    }
                    else {
                        return [true, "free", "This day is free"];
                    }
                }
            }
            private getCalendarMonthCount(): number {
                var fw = $(window).width();
                var w = fw - 450;
                var factor = 220;
                var n = 4;
                if (w <= (factor * 2)) {
                    n = Math.round((w + (factor / 2)) / factor) + 1;
                }
                return n;
            }
            private setCalendarMonthCount(): number {
                var n = this.getCalendarMonthCount();
                var cn = $('#bookingCalendar').datepicker("option", "numberOfMonths");
                if (n != cn) {
                    $('#bookingCalendar').datepicker("option", "numberOfMonths", n);
                }
                return n;
            }
            private loadInitialisationData(): JQueryPromise<void> {
                var deferred = $.Deferred<void>();
                var calendarInfoUrl = str.format("bookingapi/calendar/{0}/setup/info", this.app.parameters.currentAbode.id); // returns today, and overall date range
                var dayStatusUrl = str.format("bookingapi/calendar/{0}/status", this.app.parameters.currentAbode.id); // returns individual day status for every day
                $.when(
                    ajax.Get({ url: calendarInfoUrl }, false),
                    ajax.Get({ url: dayStatusUrl }, false)
                ).then((r1, r2) => {
                    var csi: server.calendarSetup = r1[0];
                    this.today = moment(csi.Today).toDate();
                    this.calendarPeriod.start = moment(csi.StartAt).toDate();// moment(r2[0].startAt).toDate();
                    this.calendarPeriod.end = moment(csi.Until).toDate();// moment(r2[0].until).toDate();
                    var dayInformation: server.dayInformation[] = r2[0];
                    this.loadDayInformation(dayInformation);
                    deferred.resolve();
                });
                return deferred.promise();
            }
            private loadDayInformation(diList: server.dayInformation[]) {
                diList.forEach((value, index, array) => {
                    this.dayDictionary.setValue(value.day, value);
                });
            }
            private showForm(): void {
                var url = str.format("bookingadmin/get/blockedperiods/{0}", this.app.parameters.currentAbode.id);
                ajax.Get({ url: url }, false).then((d: server.bookingAvailability) => {
                    //var bookingOpen = d.bookingOpen;
                    var mdm = new manageDaysModel(d);
                    //mdm.isOpen = bookingOpen;
                    this.vm = new observableManageDaysModel(mdm);
                    var templateUrl = "booking/managedays";
                    wt.getTemplate({ ctx: this, templateUrl: templateUrl }).then((r) => {
                        var f = new forms.form(this, {
                            modal: false,
                            title: "Manage Booking Days",
                            styleClasses: ["report-forms"],
                            okButton: null,
                            cancelButtonText: "Administration page",
                            additionalButtons: [
                                { text: "Home page", command: "back-to-site", position: forms.buttonPosition.left }
                            ],

                        }, this.vm);
                        f.setContentHtml(r.template);
                        f.open((ctx: manageDays, f: forms.form, cmd: string, data: manageDaysModels, ct: EventTarget) => {
                            switch (cmd) {
                                case "remove-blocked-period":
                                    var id = parseInt($(ct).closest("tr").attr("data-id"));
                                    this.removeBlockedPeriod(id).then(() => {
                                        this.reloadCalendar().then(() => {
                                            f.close();
                                            var md = new manageDays(this.app);
                                            md.start();
                                        });
                                    });
                                    break;
                                case "save-new-period":
                                    if (f.isValid()) {
                                        this.saveBlockedPeriod(data.current).then((r) => {
                                            if (r.success) {
                                                // reload this form
                                                f.close();
                                                var md = new manageDays(this.app);
                                                md.start();
                                            } else {
                                                f.setMessage(r.message);
                                            }
                                        });
                                    }
                                    break;
                                case "open-new-period-form":
                                    f.find(".online-booking-subform").addClass("hidden");
                                    f.find(".new-period-subform").removeClass("hidden");
                                    f.find(".new-period-button").addClass("hidden");
                                    break;
                                case "close-new-period-form":
                                    f.find(".online-booking-subform").removeClass("hidden");
                                    f.find(".new-period-subform").addClass("hidden");
                                    f.find(".new-period-button").removeClass("hidden");
                                    break;
                                case "cancel-command":
                                    f.close();
                                    var index = new adminIndex(this.app);
                                    index.start();
                                    break;
                                case "back-to-site":
                                    f.close();
                                    location.href = "/home";
                                    break;
                                case "close-online-booking":
                                    this.setOnlineBooking(false).then(() => {
                                        this.vm.isOpen(false);
                                    });
                                    break;
                                case "open-online-booking":
                                    this.setOnlineBooking(true).then(() => {
                                        this.vm.isOpen(true);
                                    });
                                    break;
                            }
                        }).then(() => {
                            var initialNumberOfMonths = this.getCalendarMonthCount();
                            this.addBookingCalendar(initialNumberOfMonths);
                        });
                    });
                });
            }
            private reloadCalendar(): JQueryPromise<void> {
                var deferred = $.Deferred<void>();
                var dayStatusUrl = str.format("bookingapi/calendar/{0}/status", this.app.parameters.currentAbode.id); // returns individual day status for every day
                ajax.Get({ url: dayStatusUrl }, false).then((di) => {
                    var dayInformation: server.dayInformation[] = di;
                    this.loadDayInformation(dayInformation);
                    $('#bookingCalendar').datepicker("refresh");
                    deferred.resolve();
                });
                return deferred.promise();
            }
            private removeBlockedPeriod(id: number): JQueryPromise<void> {
                var deferred = $.Deferred<void>();
                var url = str.format("bookingadmin/delete/blockedperiod/{0}/{1}", this.app.parameters.currentAbode.id, id);
                ajax.Post({ url: url, data: null }).then(() => {
                    deferred.resolve();
                });
                return deferred.promise();
            }
            private saveBlockedPeriod(m: manageDaysModel): JQueryPromise<blockerPeriodSaveResult> {
                var deferred = $.Deferred<blockerPeriodSaveResult>();
                //var endsOn = moment(m.newPeriodFrom).add(m.newPeriodDuration - 1, 'd').toDate()
                var endsOn = str.toMoment(m.newPeriodFrom).add(m.newPeriodDuration - 1, 'd').toDate();
                var from = str.toDateString(m.newPeriodFrom);
                var to = str.toDateString(endsOn);
                var abodeId = this.app.parameters.currentAbode.id;
                var url = str.format("bookingadmin/create/blockedperiod/{0}", abodeId);
                ajax.Post({ url: url, data: { from: from, to: to, remarks: m.newPeriodRemarks } }).then((r) => {
                    if (r.success) {
                        this.reloadCalendar().then(() => {
                            deferred.resolve({ success: true, message: null });
                        });
                    } else {
                        deferred.resolve({ success: false, message: r.error });
                    }
                });
                return deferred.promise();
            }
            private setOnlineBooking(open: boolean): JQueryPromise<void> {
                var deferred = $.Deferred<void>();
                var url = str.format("bookingadmin/onlinebooking/set/{0}", open);
                ajax.Post({ url: url, data: null }).then(() => {
                    deferred.resolve();
                });
                return deferred.promise();
            }
        }
        class editBookingResult {
            dataUpdated: boolean;
            booking: bookingModel; // set if dataUpdated == true
            statusChanged: boolean;
        }
        class bookingReport extends adminSubapp {
            private propertyInfo = new collections.Dictionary<string, number>();
            private dataTable: DataTables.DataTable = null;
            constructor(app: adminApp) {
                super(app);
            }
            public start(rt: bookingReportType = bookingReportType.normal): void {

                $.fn.dataTable.moment('DDMMMYYYY');
                var reportFormTemplate = "booking/bookingreportform";
                var reportTemplate = "booking/bookingreport";
                var dataurl = "";//str.format("bookingadmin/get/bookings/{0}", this.app.parameters.currentAbode.id);
                var heading = "";//"All Bookings";
                switch (rt) {
                    case bookingReportType.normal:
                        dataurl = str.format("bookingadmin/get/bookings/{0}", this.app.parameters.currentAbode.id);
                        heading = "All Bookings";
                        break;
                    case bookingReportType.unpaid:
                        heading = "All Unpaid Bookings";
                        dataurl = str.format("bookingadmin/get/bookings/{0}/true", this.app.parameters.currentAbode.id);
                        break;
                    case bookingReportType.cancelled:
                        heading = "Cancelled Bookings";
                        dataurl = str.format("bookingadmin/get/bookings/cancelled/{0}", this.app.parameters.currentAbode.id);
                        break;
                    case bookingReportType.archived:
                        heading = "Archived Bookings";
                        dataurl = str.format("bookingadmin/get/bookings/history/{0}", this.app.parameters.currentAbode.id);
                        break;
                }
                wt.getTemplate({ ctx: this, templateUrl: reportFormTemplate }).then((r) => {
                    var formTemplate = r.template;
                    var oform = new forms.form(this, {
                        modal: false,
                        title: heading,
                        styleClasses: ["report-forms"], //configuration.getFormStyleClasses(),
                        cancelButtonText: "Administration page",
                        okButton: null,
                        additionalButtons: [
                            { text: "Home page", command: "back-to-site", position: forms.buttonPosition.left }
                        ]
                    }, null);
                    wt.getTemplate({ ctx: this, templateUrl: reportTemplate }).then((dt) => {
                        var template = dt.template;
                        var phoneNumberCellIndex = this.findCellIndexInTemplate(template, "memberPhoneNumber");
                        this.propertyInfo.setValue("memberPhoneNumber", phoneNumberCellIndex);
                        this.propertyInfo.setValue("statusName", this.findCellIndexInTemplate(template, "statusName"));
                        ajax.Get({ url: dataurl }, false).then((bookingList: bookingModel[]) => {
                            //**NB** 
                            // bookingList is defined to be a bookingModel[]
                            // BUT it consists of a list of objects that are NOT instances of bookingModel -
                            // this is because the json data retrieved using ajax is converted into javascript objects
                            // and there is no way that javascript knows that I would prefer the typescript class bookingModel to be used.
                            // You can see this difference if you create an instance of bookingModel, i.e.
                            // var xxx = new bookingModel();
                            // now xxx instanceof fastnet.booking.bookingModel returns true, whereas
                            // bookingList[0] instanceof fastnet.booking.bookingModel returns false!
                            // This would be particularly useful in this code because i would like to be able
                            // define a method on bookingModel, have it overridden in dwhBookingModel, and call it
                            // so that I can have customised behaviour in the normal OOP style.
                            // Luckily, so far, I do not need customised editing of a booking
                            var html = Mustache.render(template, { heading: heading, data: bookingList });
                            oform.setContentHtml(html);

                            oform.open((ctx: any, f: forms.form, cmd: string, data: any, ct: EventTarget) => {
                                switch (cmd) {
                                    default:
                                        debug.print("cmd: {0} - not implemented", cmd);
                                        break;
                                    case "cancel-command":
                                        f.close();
                                        var index = new adminIndex(this.app);
                                        index.start();
                                        break;
                                    case "back-to-site":
                                        f.close();
                                        location.href = "/home";
                                        break;
                                }
                            }).then(() => {
                                // 16Oct2015 why data-table-cmd instead of data-cmd?
                                // the forms system supports "embedded" buttons using the data-cmd attribute
                                // BUT this does not work when there is a table in the form and this table is
                                // handled by jquery.datatables.
                                // The reason is that datatables restructures the table (rows for paging
                                // and columns as a result of column hiding). If the data content is then updated
                                // (as required by the edit booking semantics) then the row is regenerated by
                                // datatables thus loosing the button[data-cmd] click binding.
                                // The solution here is that I separately bind button[data-table-cmd] and rebind that as
                                // and when data updates occur.
                                // A better solution would be to integrate datatables into the forms system -
                                // but this is a lot of work and I am not prepared to do it for now.
                                oform.find("#booking-report-table button[data-table-cmd]").on("click", (e) => {
                                    debug.print("data-table-cmd");
                                    this.embeddedButtonHandler(bookingList, e);
                                });
                                this.dataTable = oform.find("#booking-report-table").DataTable({
                                    "columnDefs": [{ "type": "natural", targets: 0 }],
                                    pagingType: "simple",
                                    order: [[0, 'asc']]
                                });
                            });
                        });
                    });
                });

            }
            private findCellIndexInTemplate(template: string, property: string): number {
                var selector = `td:contains('{{${property}}}')`;
                //var x = $(template).find("td:contains('{{memberPhoneNumber}}')");
                //$(x).closest("tr").find("td").index(x)
                var cell = $(template).find(selector);
                return $(cell).closest("tr").find("td").index(cell);
            }
            private embeddedButtonHandler(bookingList: bookingModel[], e: JQueryEventObject): void {
                e.stopPropagation();
                var ct = e.target;
                var cmd = $(ct).attr("data-table-cmd");
                var id = parseInt($(ct).closest("tr").attr("data-booking-id"));
                var booking = this.findBooking(bookingList, id);
                debug.print("data-table-cmd: {0} {1}", cmd, id);
                switch (cmd) {
                    case "mark-paid":
                    case "mark-not-paid":
                        var makeUnpaid = cmd === "mark-not-paid" ? true : false;
                        this.showSetPaidForm(booking, makeUnpaid).then((updated) => {
                            if (updated) {
                                var row = this.dataTable.row($(ct).closest("tr")[0]);
                                if (makeUnpaid) {
                                    $(row.node()).removeClass("is-paid");
                                } else {
                                    $(row.node()).addClass("is-paid");
                                }
                            }
                        });
                        break;
                    case "edit-booking":
                        this.showEditBookingForm(booking).then((r) => {
                            if (r.dataUpdated) {
                                booking.memberPhoneNumber = r.booking.memberPhoneNumber;
                                booking.notes = r.booking.notes;
                                var rowElement = $(ct).closest("tr");
                                var d = this.dataTable.row(rowElement).data();
                                var pnIndex = this.propertyInfo.getValue("memberPhoneNumber");
                                //debug.print("before change: {0}", d[pnIndex]);
                                d[pnIndex] = r.booking.memberPhoneNumber;
                                this.dataTable.row(rowElement).data(d).draw();
                                $(rowElement).find("button[data-table-cmd]").on("click", (e) => {
                                    this.embeddedButtonHandler(bookingList, e);
                                });
                                //var d2 = this.dataTable.row(rowElement).data();
                                //debug.print("after change: {0}", d2[pnIndex]);
                            } else if (r.statusChanged) {
                                //function bookingStatusToString(s: server.bookingStatus): string {
                                //    switch (s) {
                                //        case server.bookingStatus.WaitingApproval:
                                //            return "WaitingApproval";
                                //        case server.bookingStatus.Cancelled:
                                //            return "Cancelled";
                                //        //case server.bookingStatus.AutoCancelled:
                                //        //    return "AutoCancelled";
                                //        case server.bookingStatus.Confirmed:
                                //            return "Confirmed";
                                //        case server.bookingStatus.WaitingPayment:
                                //            return "WaitingPayment";
                                //    }
                                //}
                                booking.status = r.booking.status;
                                booking.statusName = this.bookingStatusToString(booking.status);
                                var rowElement = $(ct).closest("tr");
                                var d = this.dataTable.row(rowElement).data();
                                var snIndex = this.propertyInfo.getValue("statusName");
                                var oldStatus = d[snIndex];
                                d[snIndex] = booking.statusName;
                                $(rowElement).removeClass("status-" + oldStatus).addClass("status-" + booking.statusName);
                                this.dataTable.row(rowElement).data(d).draw();
                                //var cells = $(rowElement).find("td");
                                $(rowElement).find("button[data-table-cmd]").on("click", (e) => {
                                    this.embeddedButtonHandler(bookingList, e);
                                });
                            }
                        });
                        break;
                }
            }
            private bookingStatusToString(s: server.bookingStatus): string {
                switch (s) {
                    case server.bookingStatus.WaitingApproval:
                        return "WaitingApproval";
                    case server.bookingStatus.Cancelled:
                        return "Cancelled";
                    //case server.bookingStatus.AutoCancelled:
                    //    return "AutoCancelled";
                    case server.bookingStatus.Confirmed:
                        return "Confirmed";
                    case server.bookingStatus.WaitingPayment:
                        return "WaitingPayment";
                }
            }
            private findBooking(list: bookingModel[], id: number): bookingModel {
                return list.filter((item) => {
                    return item.bookingId === id;
                })[0];
            }
            private showSetPaidForm(booking: bookingModel, makeUnpaid = false): JQueryPromise<boolean> {
                var deferred = $.Deferred<boolean>();
                var setPaidFormTemplate = "booking/setpaidform";
                wt.getTemplate({ ctx: this, templateUrl: setPaidFormTemplate }).then((r) => {
                    var bm = factory.getObservableBookingModel(booking);
                    var spf = new forms.form(this, {
                        initialWidth: 600,
                        modal: true,
                        styleClasses: configuration.getFormStyleClasses(),
                        title: str.format("Booking: {0}", booking.reference),
                        okButtonText: makeUnpaid ? "Set Not Paid" : "Set Paid"
                    }, bm);
                    spf.setContentHtml(r.template);
                    spf.open((ctx: any, f: forms.form, cmd: string, data: any) => {
                        switch (cmd) {
                            case "ok-command":
                                this.changePaidState(booking, makeUnpaid ? false : true).then(() => {
                                    f.close();
                                    deferred.resolve(true);
                                });
                                break;
                            case "cancel-command":
                                f.close();
                            //break;
                            default:
                                deferred.resolve(false);
                                break;
                        }
                    });
                });
                return deferred.promise();
            }
            private showEditBookingForm(booking: bookingModel): JQueryPromise<editBookingResult> {
                var result: editBookingResult = new editBookingResult();
                result.dataUpdated = false;
                result.statusChanged = false;
                var deferred = $.Deferred<editBookingResult>();
                var editBookingFormTemplate = "booking/editBookingform";
                wt.getTemplate({ ctx: this, templateUrl: editBookingFormTemplate }).then((r) => {
                    var bm = factory.getObservableBookingModel(booking);
                    var options: forms.formOptions = {
                        initialWidth: 600,
                        modal: true,
                        styleClasses: configuration.getFormStyleClasses(),
                        title: str.format("Booking: {0}", booking.reference),
                        okButtonText: "Save Changes",
                    };
                    switch (booking.status) {
                        case server.bookingStatus.WaitingApproval:
                            options.additionalButtons = [
                                { text: "Cancel Booking", command: "cancel-booking", position: forms.buttonPosition.left },
                                { text: "Approve Booking", command: "approve-booking", position: forms.buttonPosition.left },
                                //{ text: "Confirm Booking", command: "confirm-booking", position: forms.buttonPosition.left }
                            ];
                            break;
                        case server.bookingStatus.WaitingPayment:
                            options.additionalButtons = [
                                { text: "Cancel Booking", command: "cancel-booking", position: forms.buttonPosition.left },
                                //{ text: "Confirm Booking", command: "confirm-booking", position: forms.buttonPosition.left }
                            ];
                            break;
                        case server.bookingStatus.Confirmed:
                            options.additionalButtons = [
                                { text: "Cancel Booking", command: "cancel-booking", position: forms.buttonPosition.left },
                            ];
                            break;
                    }
                    var spf = new forms.form(this, options, bm);
                    spf.setContentHtml(r.template);
                    spf.open((ctx: any, f: forms.form, cmd: string, data: bookingModels) => {
                        switch (cmd) {
                            case "ok-command":
                                this.updateBooking(data.current).then(() => {
                                    result.dataUpdated = true;
                                    result.booking = data.current;
                                    if (result.booking.status != server.bookingStatus.Cancelled) {
                                        f.enableCommand("cancel-booking");
                                        if (result.booking.status != server.bookingStatus.Confirmed) {
                                            f.enableCommand("confirm-booking");
                                        }
                                    }
                                    f.setMessage("Changes saved");
                                });
                                break;
                            //case "confirm-booking":
                            //    f.disableCommand("confirm-booking");
                            //    data.current.status = server.bookingStatus.Confirmed;
                            //    this.changeStatus(data.current).then(() => {
                            //        result.statusChanged = true;
                            //        result.booking = data.current;
                            //        f.setMessage("Booking confirmed");
                            //    });
                            //    break;
                            case "cancel-booking":
                                f.disableCommand("confirm-booking");
                                f.disableCommand("cancel-booking");
                                //data.current.status = server.bookingStatus.Cancelled;
                                this.cancelBooking(data.current).then(() => {
                                    result.statusChanged = true;
                                    result.booking = data.current;
                                    f.setMessage("Booking cancelled");
                                });
                                break;
                            case "approve-booking":
                                f.disableCommand("approve-booking");
                                //data.current.status = server.bookingStatus.WaitingPayment;
                                this.approveBooking(data.current).then(() => {
                                    result.statusChanged = true;
                                    result.booking = data.current;
                                    f.setMessage("Booking approved");
                                });
                                break;
                            case "cancel-command":
                                f.close();
                            //break;
                            default:
                                deferred.resolve(result);
                                break;
                        }
                    }, (f: forms.form, property: string) => {
                        f.setMessage("");
                        f.disableCommand("cancel-booking");
                        f.disableCommand("approve-booking");
                    });
                });
                return deferred.promise();
            }
            private cancelBooking(booking: bookingModel): JQueryPromise<void> {
                var deferred = $.Deferred<void>();
                var url = str.format("bookingadmin/cancel/booking/{0}", booking.bookingId);
                ajax.Post({ url: url, data: null }).then(() => {
                    deferred.resolve();
                });
                return deferred.promise();
            }
            private approveBooking(booking: bookingModel): JQueryPromise<void> {
                var deferred = $.Deferred<void>();
                var url = str.format("bookingadmin/approve/booking/{0}", booking.bookingId);
                ajax.Post({ url: url, data: null }).then(() => {
                    deferred.resolve();
                });
                return deferred.promise();
            }
            //private changeStatus(booking: bookingModel): JQueryPromise<void> {
            //    var deferred = $.Deferred<void>();
            //    var url = str.format("bookingadmin/update/booking/{0}/status/{1}", booking.bookingId, booking.status);
            //    ajax.Post({ url: url, data: null }).then(() => {
            //        deferred.resolve();
            //    });
            //    return deferred.promise();
            //}
            private updateBooking(booking: bookingModel): JQueryPromise<void> {
                var deferred = $.Deferred<void>();
                var url = str.format("bookingadmin/update/booking");
                ajax.Post({ url: url, data: booking }).then(() => {
                    deferred.resolve();
                });
                return deferred.promise();
            }
            private changePaidState(booking: bookingModel, paid: boolean): JQueryPromise<void> {
                var deferred = $.Deferred<void>();
                var url = str.format("bookingadmin/update/booking/{0}/paidstate/{1}", booking.bookingId, paid);
                ajax.Post({ url: url, data: null }).then(() => {
                    deferred.resolve();
                });
                return deferred.promise();
            }
        }
        class occupancyReport extends adminSubapp {
            private minimumDate: Date;
            private maximumDate: Date;
            private dayTemplate: string;
            constructor(app: adminApp) {
                super(app);
            }
            public start(): void {
                var calendarInfoUrl = str.format("bookingapi/calendar/{0}/setup/info", this.app.parameters.currentAbode.id);
                ajax.Get({ url: calendarInfoUrl }, false).then((r) => {
                    var csi: server.calendarSetup = r;
                    var start = moment(csi.StartAt);//.toDate();// moment(r2[0].startAt).toDate();
                    var end = moment(csi.Until);//.toDate();// moment(r2[0].until).toDate();
                    this.minimumDate = new Date(start.year(), start.month(), 1);
                    this.maximumDate = new Date(end.year(), end.month(), end.daysInMonth());

                    var oform = new forms.form(this, {
                        modal: false,
                        title: "Occupancy Report",
                        styleClasses: ["report-forms"], //configuration.getFormStyleClasses(),
                        cancelButtonText: "Administration page",
                        okButton: null,
                        additionalButtons: [
                            { text: "Home page", command: "back-to-site", position: forms.buttonPosition.left }
                        ]
                    }, null);
                    var reportTemplate = "booking/occupancyreport";
                    var dayTemplate = "booking/occupancyreportday";
                    wt.getTemplate({ ctx: this, templateUrl: dayTemplate }).then((dt) => {
                        this.dayTemplate = dt.template;
                        wt.getTemplate({ ctx: this, templateUrl: reportTemplate }).then((r) => {
                            oform.setContentHtml(r.template);
                            //this.addMonthPickers(r.template);
                            oform.open((ctx: configIndex, f: forms.form, cmd: string, data: any) => {
                                switch (cmd) {
                                    case "cancel-command":
                                        f.close();
                                        var index = new adminIndex(this.app);
                                        index.start();
                                        break;
                                    case "back-to-site":
                                        f.close();
                                        location.href = "/home";
                                        break;
                                    case "start-report":
                                        this.showReport();
                                        break;
                                    default:
                                        forms.messageBox.show("This feature not yet implemented").then(() => { });
                                        break;
                                }
                            }).then((f) => {
                                this.addMonthPickers(f);
                            });
                        });
                    });
                });
            }
            public addMonthPickers(f: forms.form): void {
                f.find("#startMonthPicker, #endMonthPicker").datepicker({
                    minDate: this.minimumDate,
                    maxDate: this.maximumDate,
                    changeMonth: true,
                    changeYear: true,
                    onChangeMonthYear: function (year, month, inst) {
                        // first update the date picker as we are not showing any calendar
                        var d = new Date(year, month - 1, 1);
                        $(`#${inst.id}`).datepicker("setDate", d);
                        var sm = moment($("#startMonthPicker").datepicker("getDate"));
                        var em = moment($("#endMonthPicker").datepicker("getDate"));
                        var duration = em.diff(sm, 'm');
                        if (duration < 0) {
                            if (inst.id === "startMonthPicker") {
                                $("#endMonthPicker").datepicker("setDate", sm.toDate());
                            } else {
                                $("#startMonthPicker").datepicker("setDate", em.toDate());
                            }
                        }
                        //debug.print("{0} changed to {1}, {2}, sm: {3}, em: {4}", inst.id, year, month, sm.format("DDMMMYYYY"), em.format("DDMMMYYYY"));
                    }
                });
            }
            public showReport(): void {
                var sm = moment($("#startMonthPicker").datepicker("getDate"));
                var em = moment($("#endMonthPicker").datepicker("getDate"));
                var syear = sm.year();
                var smonth = sm.month() + 1;
                var eyear = em.year();
                var emonth = em.month() + 1;
                //var dayTemplateUrl = str.format("bookingadmin/get/occupancy/{0}/{1}/{2}/{3}", syear, smonth, eyear, emonth);
                var reportUrl = str.format("bookingadmin/get/occupancy/{0}/{1}/{2}/{3}/{4}",
                    this.app.parameters.currentAbode.id, syear, smonth, eyear, emonth);
                ajax.Get({ url: reportUrl }, false).then((r: server.dayInformation[]) => {
                    var html = $(Mustache.render(this.dayTemplate, { data: r }));
                    $(".report-content").empty().append($(html));
                });
            }
        }
        class emailTemplates extends adminSubapp {
            constructor(app: adminApp) {
                super(app);
            }
            public start(): void {
                var templateListUrl = "bookingadmin/get/emailtemplatelist";
                ajax.Get({ url: templateListUrl }).then((tl: string[]) => {
                    var templateUrl = "booking/emailTemplate";
                    wt.getTemplate({ ctx: this, templateUrl: templateUrl }).then((r) => {
                        var etm = new editTemplateModel(tl);
                        var vetm = new observableEditTemplateModel(etm);
                        var f = new forms.form(this, {
                            modal: false,
                            initialHeight: 500,
                            title: "Email Template Editor",
                            styleClasses: ["report-forms"],
                            cancelButtonText: "Administration page",
                            okButtonText: "Save Changes",
                            additionalButtons: [
                                { text: "Home page", command: "back-to-site", position: forms.buttonPosition.left },
                                { text: "Help with templates ...", command: "template-key-words", position: forms.buttonPosition.left }
                            ],

                        }, vetm);
                        f.setContentHtml(r.template);
                        f.open((ctx: any, f: forms.form, cmd: string, data: editTemplateModels) => {
                            switch (cmd) {
                                case "ok-command":
                                    if (f.isValid()) {
                                        this.saveEmailTemplate(data.current.selectedTemplate, data.current.subjectText, data.current.bodyHtml).then(() => {
                                            f.setMessage("Changes saved");
                                        });
                                    }
                                    break;
                                case "cancel-command":
                                    f.close();
                                    var index = new adminIndex(this.app);
                                    index.start();
                                    break;
                                case "back-to-site":
                                    f.close();
                                    location.href = "/home";
                                    break;
                                case "template-key-words":
                                    this.showKeyWords();
                                    break;
                            }
                        }, (f, pn) => {
                            if (pn === "selectedTemplate") {
                                f.setMessage('');
                                var emailTemplateName = vetm.selectedTemplate();
                                if (emailTemplateName !== undefined) {
                                    //debug.print("template {0} selected", vetm.selectedTemplate());
                                    f.find(".template-editor").removeClass("hidden");
                                    //f.find(".template-editor iframe").css("height", 320); // make this work dynamically!!!!
                                    var url = str.format("bookingadmin/get/emailtemplate/{0}", encodeURIComponent(vetm.selectedTemplate()));
                                    ajax.Get({ url: url }, false).then((r) => {
                                        vetm.subjectText(r.subjectText);
                                        var editor = f.findRichTextEditor("bodyHtml");
                                        editor.setContent(r.bodyText);
                                        f.enableCommand("ok-command");
                                    });
                                } else {
                                    f.find(".template-editor").addClass("hidden");
                                    f.disableCommand("ok-command");
                                }
                            } else {
                                debug.print("property {0} changed", pn);
                            }
                        }).then(() => {
                            f.disableCommand("ok-command");
                        });
                    });
                });
            }
            private showKeyWords(): void {
                var templateurl = "booking/emailkeywords";
                wt.getTemplate({ ctx: this, templateUrl: templateurl }).then((r) => {
                    var f = new forms.form(this, {
                        modal: true,
                        title: "Email Template Keywords",
                        styleClasses: ["report-forms"],
                        okButtonText: "Close",
                        cancelButton: null,
                        initialHeight: 560,
                        initialWidth: 750
                    }, null);
                    f.setContentHtml(r.template);
                    f.open((ctx: any, f: forms.form, cmd: string, data: any) => {
                        f.close();
                    });
                });
            }
            private saveEmailTemplate(template: string, subjectText: string, bodyHtml: string): JQueryPromise<void> {
                var deferred = $.Deferred<void>();
                var url = "bookingadmin/update/emailTemplate";
                var data = { template: template, subjectText: subjectText, bodyText: bodyHtml };
                ajax.Post({ url: url, data: data }).then(() => {
                    deferred.resolve();
                });
                return deferred.promise();
            }
        }
    }
}
