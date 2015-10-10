/// <reference path="../../../scripts/typings/mustache/mustache.d.ts" />
/// <reference path="../../../scripts/typings/jquery.datatables/jquery.datatables.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var fastnet;
(function (fastnet) {
    var ajax = fastnet.util.ajax;
    var debug = fastnet.util.debug;
    var str = fastnet.util.str;
    var wt = fastnet.web.tools;
    var forms = fastnet.forms;
    var configuration = (function () {
        function configuration() {
        }
        configuration.getFormStyleClasses = function () {
            return ["booking-forms"];
        };
        return configuration;
    })();
    var booking;
    (function (booking_1) {
        var bookingReportType;
        (function (bookingReportType) {
            bookingReportType[bookingReportType["normal"] = 0] = "normal";
            bookingReportType[bookingReportType["unpaid"] = 1] = "unpaid";
            bookingReportType[bookingReportType["archived"] = 2] = "archived";
            bookingReportType[bookingReportType["cancelled"] = 3] = "cancelled";
        })(bookingReportType || (bookingReportType = {}));
        var adminApp = (function () {
            function adminApp() {
            }
            adminApp.prototype.start = function () {
                var _this = this;
                this.initialise().then(function () {
                    var index = new adminIndex(_this);
                    index.start();
                });
            };
            adminApp.prototype.initialise = function () {
                var _this = this;
                var deferred = $.Deferred();
                var config = {
                    modelessContainer: "admin-interaction",
                };
                forms.form.initialise(config);
                var parametersUrl = "bookingapi/parameters";
                ajax.Get({ url: parametersUrl }, false).then(function (r) {
                    booking_1.factory.setFactory(r.factoryName);
                    _this.parameters = booking_1.factory.getParameters(r);
                    //this.bookingParameters = <server.bookingParameters>r;
                    //factory.setFactory(this.bookingParameters.factoryName);// .FactoryName);
                    deferred.resolve();
                });
                return deferred.promise();
            };
            return adminApp;
        })();
        booking_1.adminApp = adminApp;
        var adminSubapp = (function () {
            function adminSubapp(app) {
                this.app = app;
            }
            return adminSubapp;
        })();
        var adminIndex = (function (_super) {
            __extends(adminIndex, _super);
            //private app: adminApp;
            function adminIndex(app) {
                _super.call(this, app);
                //this.app = app;
            }
            adminIndex.prototype.start = function () {
                var _this = this;
                debug.print("admin index started");
                var aiForm = new forms.form(this, {
                    modal: false,
                    title: "Booking Administration",
                    styleClasses: configuration.getFormStyleClasses(),
                    cancelButtonText: "Home page",
                    okButton: null
                }, null);
                var adminIndexFormTemplateUrl = "booking/adminIndex";
                wt.getTemplate({ ctx: this, templateUrl: adminIndexFormTemplateUrl }).then(function (r) {
                    aiForm.setContentHtml(r.template);
                    aiForm.open(function (ctx, f, cmd, data) {
                        switch (cmd) {
                            case "cancel-command":
                                f.close();
                                location.href = "/home";
                                break;
                            case "edit-configuration":
                                f.close();
                                var ci = new configIndex(_this.app);
                                ci.start();
                                break;
                            case "view-occupancy":
                                f.close();
                                var or = new occupancyReport(_this.app);
                                or.start();
                                break;
                            case "view-bookings":
                                f.close();
                                var br = new bookingReport(_this.app);
                                br.start();
                                break;
                            case "view-unpaid-bookings":
                                f.close();
                                var br = new bookingReport(_this.app);
                                br.start(bookingReportType.unpaid);
                                break;
                            case "view-cancelled-bookings":
                                f.close();
                                var br = new bookingReport(_this.app);
                                br.start(bookingReportType.cancelled);
                                break;
                            case "view-archived-bookings":
                                f.close();
                                var br = new bookingReport(_this.app);
                                br.start(bookingReportType.archived);
                                break;
                            default:
                                forms.messageBox.show("This feature not yet implemented").then(function () { });
                                break;
                        }
                    });
                });
            };
            return adminIndex;
        })(adminSubapp);
        var configIndex = (function (_super) {
            __extends(configIndex, _super);
            function configIndex(app) {
                _super.call(this, app);
                //this.app = app;
            }
            configIndex.prototype.start = function () {
                var _this = this;
                debug.print("configuration index started");
                var ciForm = new forms.form(this, {
                    modal: false,
                    title: "Booking Configuration",
                    styleClasses: configuration.getFormStyleClasses(),
                    cancelButtonText: "Administration page",
                    okButton: null,
                    additionalButtons: [
                        { text: "Home page", command: "back-to-site", position: 1 /* left */ }
                    ]
                }, null);
                var configurationIndexFormTemplateUrl = "booking/configurationIndex";
                wt.getTemplate({ ctx: this, templateUrl: configurationIndexFormTemplateUrl }).then(function (r) {
                    ciForm.setContentHtml(r.template);
                    ciForm.open(function (ctx, f, cmd, data) {
                        switch (cmd) {
                            case "cancel-command":
                                f.close();
                                var index = new adminIndex(_this.app);
                                index.start();
                                break;
                            case "back-to-site":
                                f.close();
                                location.href = "/home";
                                break;
                            case "edit-parameters":
                                f.close();
                                var pf = new parametersApp(_this.app);
                                pf.start();
                                break;
                            default:
                                forms.messageBox.show("This feature not yet implemented").then(function () { });
                                break;
                        }
                    });
                });
            };
            return configIndex;
        })(adminSubapp);
        var parametersApp = (function (_super) {
            __extends(parametersApp, _super);
            function parametersApp(app) {
                _super.call(this, app);
                //this.app = app;
            }
            parametersApp.prototype.start = function () {
                var _this = this;
                debug.print("parametersApp started");
                var url = "bookingapi/parameters";
                ajax.Get({ url: url }, false).then(function (r) {
                    booking_1.factory.setFactory(r.factoryName);
                    var model = booking_1.factory.getParameters(r);
                    //model.setFromJSON(r);
                    var vm = model.getObservable();
                    _this.showForm(vm);
                });
            };
            parametersApp.prototype.showForm = function (vm) {
                var _this = this;
                var paraForm = new forms.form(this, {
                    modal: false,
                    title: "Parameters",
                    styleClasses: configuration.getFormStyleClasses(),
                    okButtonText: "Save changes",
                    cancelButton: null,
                    additionalButtons: [
                        { text: "Home page", command: "back-to-site", position: 1 /* left */ },
                        { text: "Configuration page", command: "configuration-page", position: 1 /* left */ }
                    ]
                }, vm);
                var configurationIndexFormTemplateUrl = "booking/parameters";
                wt.getTemplate({ ctx: this, templateUrl: configurationIndexFormTemplateUrl }).then(function (r) {
                    paraForm.setContentHtml(r.template);
                    paraForm.open(function (ctx, f, cmd, data) {
                        switch (cmd) {
                            case "configuration-page":
                                f.close();
                                var index = new configIndex(_this.app);
                                index.start();
                                break;
                            case "back-to-site":
                                f.close();
                                location.href = "/home";
                                break;
                            case "ok-command":
                                _this.saveParameters(f, data);
                                break;
                            default:
                                forms.messageBox.show("This feature not yet implemented"); //.then(() => { });
                                break;
                        }
                    });
                });
            };
            parametersApp.prototype.saveParameters = function (f, models) {
                var url = "bookingadmin/save/parameters";
                ajax.Post({ url: url, data: models.current }).then(function (r) {
                    f.setMessage("Changes saved");
                });
            };
            return parametersApp;
        })(adminSubapp);
        var bookingReport = (function (_super) {
            __extends(bookingReport, _super);
            function bookingReport(app) {
                _super.call(this, app);
            }
            bookingReport.prototype.start = function (rt) {
                var _this = this;
                if (rt === void 0) { rt = bookingReportType.normal; }
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
                wt.getTemplate({ ctx: this, templateUrl: reportFormTemplate }).then(function (r) {
                    var formTemplate = r.template;
                    var oform = new forms.form(_this, {
                        modal: false,
                        title: heading,
                        styleClasses: ["report-forms"],
                        cancelButtonText: "Administration page",
                        okButton: null,
                        additionalButtons: [
                            { text: "Home page", command: "back-to-site", position: 1 /* left */ }
                        ]
                    }, null);
                    wt.getTemplate({ ctx: _this, templateUrl: reportTemplate }).then(function (dt) {
                        var template = dt.template;
                        ajax.Get({ url: dataurl }, false).then(function (bookingList) {
                            var html = Mustache.render(template, { heading: heading, data: bookingList });
                            oform.setContentHtml(html);
                            oform.open(function (ctx, f, cmd, data, ct) {
                                switch (cmd) {
                                    default:
                                        debug.print("cmd: {0} - not implemented", cmd);
                                        break;
                                    case "cancel-command":
                                        f.close();
                                        var index = new adminIndex(_this.app);
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
                                        var booking = _this.findBooking(bookingList, id);
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
                            }).then(function () {
                                oform.find("#booking-report-table").DataTable({
                                    "columnDefs": [{ "type": "natural", targets: 0 }],
                                    pagingType: "simple",
                                    order: [[0, 'asc']]
                                });
                            });
                        });
                    });
                });
            };
            bookingReport.prototype.findBooking = function (list, id) {
                return list.filter(function (item) {
                    return item.bookingId === id;
                })[0];
            };
            bookingReport.prototype.showSetPaidForm = function (booking, makeUnpaid) {
                var _this = this;
                if (makeUnpaid === void 0) { makeUnpaid = false; }
                var setPaidFormTemplate = "booking/setpaidform";
                wt.getTemplate({ ctx: this, templateUrl: setPaidFormTemplate }).then(function (r) {
                    var spf = new forms.form(_this, {
                        modal: true,
                        title: "",
                        okButtonText: "Set Paid"
                    }, null);
                    spf.setContentHtml(r.template);
                    spf.open(function (ctx, f, cmd, data) {
                    });
                });
            };
            return bookingReport;
        })(adminSubapp);
        var occupancyReport = (function (_super) {
            __extends(occupancyReport, _super);
            function occupancyReport(app) {
                _super.call(this, app);
            }
            occupancyReport.prototype.start = function () {
                var _this = this;
                var calendarInfoUrl = str.format("bookingapi/calendar/{0}/setup/info", this.app.parameters.currentAbode.id);
                ajax.Get({ url: calendarInfoUrl }, false).then(function (r) {
                    var csi = r;
                    var start = moment(csi.StartAt); //.toDate();// moment(r2[0].startAt).toDate();
                    var end = moment(csi.Until); //.toDate();// moment(r2[0].until).toDate();
                    _this.minimumDate = new Date(start.year(), start.month(), 1);
                    _this.maximumDate = new Date(end.year(), end.month(), end.daysInMonth());
                    var oform = new forms.form(_this, {
                        modal: false,
                        title: "Occupancy Report",
                        styleClasses: ["report-forms"],
                        cancelButtonText: "Administration page",
                        okButton: null,
                        additionalButtons: [
                            { text: "Home page", command: "back-to-site", position: 1 /* left */ }
                        ]
                    }, null);
                    var reportTemplate = "booking/occupancyreport";
                    var dayTemplate = "booking/occupancyreportday";
                    wt.getTemplate({ ctx: _this, templateUrl: dayTemplate }).then(function (dt) {
                        _this.dayTemplate = dt.template;
                        wt.getTemplate({ ctx: _this, templateUrl: reportTemplate }).then(function (r) {
                            oform.setContentHtml(r.template);
                            //this.addMonthPickers(r.template);
                            oform.open(function (ctx, f, cmd, data) {
                                switch (cmd) {
                                    case "cancel-command":
                                        f.close();
                                        var index = new adminIndex(_this.app);
                                        index.start();
                                        break;
                                    case "back-to-site":
                                        f.close();
                                        location.href = "/home";
                                        break;
                                    case "start-report":
                                        _this.showReport();
                                        break;
                                    default:
                                        forms.messageBox.show("This feature not yet implemented").then(function () { });
                                        break;
                                }
                            }).then(function (f) {
                                _this.addMonthPickers(f);
                            });
                        });
                    });
                });
            };
            occupancyReport.prototype.addMonthPickers = function (f) {
                f.find("#startMonthPicker, #endMonthPicker").datepicker({
                    minDate: this.minimumDate,
                    maxDate: this.maximumDate,
                    changeMonth: true,
                    changeYear: true,
                    onChangeMonthYear: function (year, month, inst) {
                        // first update the date picker as we are not showing any calendar
                        var d = new Date(year, month - 1, 1);
                        $("#" + inst.id).datepicker("setDate", d);
                        var sm = moment($("#startMonthPicker").datepicker("getDate"));
                        var em = moment($("#endMonthPicker").datepicker("getDate"));
                        var duration = em.diff(sm, 'm');
                        if (duration < 0) {
                            if (inst.id === "startMonthPicker") {
                                $("#endMonthPicker").datepicker("setDate", sm.toDate());
                            }
                            else {
                                $("#startMonthPicker").datepicker("setDate", em.toDate());
                            }
                        }
                        //debug.print("{0} changed to {1}, {2}, sm: {3}, em: {4}", inst.id, year, month, sm.format("DDMMMYYYY"), em.format("DDMMMYYYY"));
                    }
                });
            };
            occupancyReport.prototype.showReport = function () {
                var _this = this;
                var sm = moment($("#startMonthPicker").datepicker("getDate"));
                var em = moment($("#endMonthPicker").datepicker("getDate"));
                var syear = sm.year();
                var smonth = sm.month() + 1;
                var eyear = em.year();
                var emonth = em.month() + 1;
                //var dayTemplateUrl = str.format("bookingadmin/get/occupancy/{0}/{1}/{2}/{3}", syear, smonth, eyear, emonth);
                var reportUrl = str.format("bookingadmin/get/occupancy/{0}/{1}/{2}/{3}/{4}", this.app.parameters.currentAbode.id, syear, smonth, eyear, emonth);
                ajax.Get({ url: reportUrl }, false).then(function (r) {
                    var html = $(Mustache.render(_this.dayTemplate, { data: r }));
                    $(".report-content").empty().append($(html));
                });
            };
            return occupancyReport;
        })(adminSubapp);
    })(booking = fastnet.booking || (fastnet.booking = {}));
})(fastnet || (fastnet = {}));
