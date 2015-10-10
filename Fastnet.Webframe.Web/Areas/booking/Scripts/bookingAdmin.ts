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
            return ["booking-forms"];
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
        class adminSubapp {
            protected app: adminApp;
            constructor(app: adminApp) {
                this.app = app;
            }
        }
        class adminIndex extends adminSubapp {
            //private app: adminApp;
            constructor(app: adminApp) {
                super(app);
                //this.app = app;
            }
            public start(): void {
                debug.print("admin index started");
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
                            default:
                                forms.messageBox.show("This feature not yet implemented").then(() => { });
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
                debug.print("configuration index started");
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
                debug.print("parametersApp started");

                var url = "bookingapi/parameters";
                ajax.Get({ url: url }, false).then((r: server.bookingParameters) => {
                    factory.setFactory(r.factoryName);
                    var model = factory.getParameters(r);
                    //model.setFromJSON(r);
                    var vm = model.getObservable();
                    this.showForm(vm);
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
                ajax.Post({ url: url, data: models.current }).then((r) => {
                    f.setMessage("Changes saved");
                });
            }
        }
        class bookingReport extends adminSubapp {
            constructor(app: adminApp) {
                super(app);
            }
            public start(rt: bookingReportType = bookingReportType.normal): void {
                $.fn.dataTable.moment('DDMMMYYYY');
                var reportFormTemplate = "booking/bookingreportform";
                var reportTemplate = "booking/bookingreport";
                var dataurl = str.format("bookingadmin/get/bookings/{0}", this.app.parameters.currentAbode.id);
                var heading = "All Bookings";
                switch (rt) {
                    case bookingReportType.normal:
                    default:
                        break;
                    case bookingReportType.unpaid:
                        heading = "All Unpaid Bookings";
                        dataurl += "/true";
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
                        ajax.Get({ url: dataurl }, false).then((bookingList: server.booking[]) => {
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
                                    case "mark-paid":
                                    case "mark-not-paid":
                                    case "edit-booking":
                                        var id = parseInt($(ct).attr("data-booking-id"));
                                        var booking = this.findBooking(bookingList, id);
                                        debug.print("cmd: {0}, id {1}, reference: {2}", cmd, id, booking.reference);
                                        switch (cmd) {
                                            case "mark-paid":
                                                break;
                                            case "mark-not-paid":
                                                break;
                                            case "edit-booking":
                                                break;
                                        }
                                        break;
                                }
                            }).then(() => {
                                oform.find("#booking-report-table").DataTable({
                                    "columnDefs": [{ "type": "natural", targets: 0 }],
                                    pagingType: "simple",
                                    order: [[0, 'asc']]
                                });
                            });
                        });
                    });
                });

            }
            private findBooking(list: server.booking[], id: number): server.booking {
                return list.filter((item) => {
                    return item.bookingId === id;
                })[0];
            }
            private showSetPaidForm(booking: server.booking, makeUnpaid = false): void {
                var setPaidFormTemplate = "booking/setpaidform";
                wt.getTemplate({ ctx: this, templateUrl: setPaidFormTemplate }).then((r) => {
                    var spf = new forms.form(this, {
                        modal: true,
                        title: "",
                        okButtonText: "Set Paid"
                    }, null);
                    spf.setContentHtml(r.template);
                    spf.open((ctx: any, f: forms.form, cmd: string, data: any) => {
                    });
                });
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
    }
}
