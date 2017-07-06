/// <reference path="../../../scripts/typings/mustache/mustache.d.ts" />
/// <reference path="../../../scripts/typings/jquery.datatables/jquery.datatables.d.ts" />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
            return ["report-forms"];
        };
        return configuration;
    }());
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
                    enableRichText: true,
                    richTextCssUrl: "../areas/booking/content/richtext.css",
                    additionalValidations: booking_1.bookingAppValidations.GetValidators()
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
        }());
        booking_1.adminApp = adminApp;
        var adminSubapp = (function () {
            function adminSubapp(app) {
                this.app = app;
            }
            return adminSubapp;
        }());
        booking_1.adminSubapp = adminSubapp;
        var adminCustomIndex = (function () {
            function adminCustomIndex() {
            }
            return adminCustomIndex;
        }());
        booking_1.adminCustomIndex = adminCustomIndex;
        var adminIndex = (function (_super) {
            __extends(adminIndex, _super);
            //private app: adminApp;
            function adminIndex(app) {
                return _super.call(this, app) || this;
                //this.app = app;
            }
            adminIndex.prototype.start = function () {
                var _this = this;
                //debug.print("admin index started");
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
                            case "manage-booking-days":
                                f.close();
                                var md = new manageDays(_this.app);
                                md.start();
                                break;
                            case "edit-pricing":
                                f.close();
                                var mp = new managePricing(_this.app);
                                mp.start();
                                break;
                            //case "email-templates":
                            //    f.close();
                            //    var et = new emailTemplates(this.app);
                            //    et.start();
                            //    break;
                            default:
                                var ch = booking_1.factory.getCustomAdminIndex();
                                if (ch != null && ch.handleCommand(f, _this.app, cmd)) {
                                }
                                else {
                                    forms.messageBox.show("This feature not yet implemented").then(function () { });
                                }
                                break;
                        }
                    });
                });
            };
            return adminIndex;
        }(adminSubapp));
        booking_1.adminIndex = adminIndex;
        var configIndex = (function (_super) {
            __extends(configIndex, _super);
            function configIndex(app) {
                return _super.call(this, app) || this;
                //this.app = app;
            }
            configIndex.prototype.start = function () {
                var _this = this;
                //debug.print("configuration index started");
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
                            case "edit-email-templates":
                                f.close();
                                var et = new emailTemplates(_this.app);
                                et.start();
                                break;
                            default:
                                forms.messageBox.show("This feature not yet implemented").then(function () { });
                                break;
                        }
                    });
                });
            };
            return configIndex;
        }(adminSubapp));
        var parametersApp = (function (_super) {
            __extends(parametersApp, _super);
            function parametersApp(app) {
                return _super.call(this, app) || this;
                //this.app = app;
            }
            parametersApp.prototype.start = function () {
                var _this = this;
                //debug.print("parametersApp started");
                var url = "bookingapi/parameters";
                ajax.Get({ url: url }, false).then(function (r) {
                    try {
                        booking_1.factory.setFactory(r.factoryName);
                        var model = booking_1.factory.getParameters(r);
                        var vm = model.getObservable();
                        _this.showForm(vm);
                    }
                    catch (e) {
                        debugger;
                    }
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
                // **NB** I am forcing this code to assume that
                // the parameters are actually dwhParameters!!
                // I no longer believe that this code will be used for anything but DWH!
                var currentDWHParameters = models.current;
                var originalDWHParameters = models.original;
                if (currentDWHParameters.privilegedMembers === undefined) {
                    // why does this situation arise? currentDWHParameters.privilegedMembers only exists
                    // if the drop down was ussed to select a group (apparently!)
                    currentDWHParameters.privilegedMembers = originalDWHParameters.privilegedMembers;
                }
                ajax.Post({ url: url, data: models.current }).then(function (r) {
                    f.setMessage("Changes saved");
                });
            };
            return parametersApp;
        }(adminSubapp));
        var managePricing = (function (_super) {
            __extends(managePricing, _super);
            function managePricing(app) {
                return _super.call(this, app) || this;
            }
            managePricing.prototype.start = function () {
                this.showForm();
            };
            managePricing.prototype.showForm = function () {
                var _this = this;
                var url = str.format("bookingadmin/get/pricing/{0}", this.app.parameters.currentAbode.id);
                ajax.Get({ url: url }, false).then(function (r) {
                    var today = str.toMoment(_this.app.parameters.today);
                    var model = new booking_1.pricingModel(today, r);
                    var vm = new booking_1.observablePricingModel(model);
                    var templateUrl = "booking/pricing";
                    wt.getTemplate({ ctx: _this, templateUrl: templateUrl }).then(function (r) {
                        var f = new forms.form(_this, {
                            modal: false,
                            title: "Manage Pricing",
                            styleClasses: ["report-forms"],
                            okButton: null,
                            cancelButtonText: "Administration page",
                            additionalButtons: [
                                { text: "Home page", command: "back-to-site", position: 1 /* left */ }
                            ]
                        }, vm);
                        f.setContentHtml(r.template);
                        f.open(function (ctx, f, cmd, data, ct) {
                            switch (cmd) {
                                case "remove-price":
                                    var id = parseInt($(ct).closest("tr").attr("data-id"));
                                    _this.removePrice(id).then(function () {
                                        f.close();
                                        var mp = new managePricing(_this.app);
                                        mp.start();
                                    });
                                    break;
                                case "add-new-price":
                                    if (f.isValid()) {
                                        _this.addNewPrice(data.current).then(function () {
                                            f.close();
                                            var mp = new managePricing(_this.app);
                                            mp.start();
                                        });
                                    }
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
                            }
                        });
                    });
                });
            };
            managePricing.prototype.removePrice = function (id) {
                var deferred = $.Deferred();
                var abodeId = this.app.parameters.currentAbode.id;
                var url = str.format("bookingadmin/remove/pricing/{0}/{1}", abodeId, id);
                ajax.Post({ url: url, data: null }).then(function () {
                    deferred.resolve();
                });
                return deferred.promise();
            };
            managePricing.prototype.addNewPrice = function (m) {
                var deferred = $.Deferred();
                var from = str.toDateString(m.newFrom);
                var amount = m.newAmount;
                var abodeId = this.app.parameters.currentAbode.id;
                var url = str.format("bookingadmin/add/pricing/{0}", abodeId);
                ajax.Post({ url: url, data: { from: from, amount: amount } }).then(function () {
                    deferred.resolve();
                });
                return deferred.promise();
            };
            return managePricing;
        }(adminSubapp));
        var manageDays = (function (_super) {
            __extends(manageDays, _super);
            function manageDays(app) {
                return _super.call(this, app) || this;
            }
            manageDays.prototype.start = function () {
                var _this = this;
                this.dayDictionary = new collections.Dictionary();
                //this.abodeId = this.app.parameters.currentAbode.id;
                this.calendarPeriod = { start: null, end: null };
                this.loadInitialisationData().then(function () {
                    // current period and all day status information has all been loaded
                    _this.showForm();
                });
            };
            manageDays.prototype.addBookingCalendar = function (nm) {
                var _this = this;
                $('#bookingCalendar').datepicker({
                    defaultDate: this.today,
                    numberOfMonths: nm,
                    minDate: this.calendarPeriod.start,
                    maxDate: this.calendarPeriod.end,
                    beforeShowDay: function (d) { return _this.calendarBeforeShowDate(d); },
                    //onChangeMonthYear: (m, y) => {
                    //    //this.calendarOnChangeMonth(m, y);
                    //},                    
                    //onSelect: this.BookingDateSelected,
                    dateFormat: 'DD d M yy'
                }).val('');
                window.onresize = function (e) {
                    _this.setCalendarMonthCount();
                };
                return this.setCalendarMonthCount();
            };
            manageDays.prototype.calendarBeforeShowDate = function (d) {
                var day = moment(d);
                if (day.isBefore(this.calendarPeriod.start) || day.isAfter(this.calendarPeriod.end)) {
                    return [false, "blocked", "Out of range"];
                }
                if (this.dayDictionary.isEmpty()) {
                    return [false, "blocked", "not ready"];
                }
                else {
                    if (this.dayDictionary.containsKey(str.toDateString(day))) {
                        var di = this.dayDictionary.getValue(str.toDateString(day));
                        var r;
                        switch (di.status) {
                            case 0 /* IsClosed */:
                                r = [false, "out-of-service", di.calendarPopup];
                                break;
                            case 2 /* IsFull */:
                                r = [false, "fully-booked", di.calendarPopup];
                                break;
                            case 4 /* IsNotBookable */:
                                r = [false, "not-bookable", di.calendarPopup];
                                break;
                            case 3 /* IsPartBooked */:
                                r = [true, "part-booked", di.calendarPopup];
                                break;
                            case 1 /* IsFree */:
                                r = [true, "free", di.calendarPopup];
                                break;
                        }
                        return r;
                    }
                    else {
                        return [true, "free", "This day is free"];
                    }
                }
            };
            manageDays.prototype.getCalendarMonthCount = function () {
                var fw = $(window).width();
                var w = fw - 450;
                var factor = 220;
                var n = 4;
                if (w <= (factor * 2)) {
                    n = Math.round((w + (factor / 2)) / factor) + 1;
                }
                return n;
            };
            manageDays.prototype.setCalendarMonthCount = function () {
                var n = this.getCalendarMonthCount();
                var cn = $('#bookingCalendar').datepicker("option", "numberOfMonths");
                if (n != cn) {
                    $('#bookingCalendar').datepicker("option", "numberOfMonths", n);
                }
                return n;
            };
            manageDays.prototype.loadInitialisationData = function () {
                var _this = this;
                var deferred = $.Deferred();
                var calendarInfoUrl = str.format("bookingapi/calendar/{0}/setup/info", this.app.parameters.currentAbode.id); // returns today, and overall date range
                var dayStatusUrl = str.format("bookingapi/calendar/{0}/status", this.app.parameters.currentAbode.id); // returns individual day status for every day
                $.when(ajax.Get({ url: calendarInfoUrl }, false), ajax.Get({ url: dayStatusUrl }, false)).then(function (r1, r2) {
                    var csi = r1[0];
                    _this.today = moment(csi.Today).toDate();
                    _this.calendarPeriod.start = moment(csi.StartAt).toDate(); // moment(r2[0].startAt).toDate();
                    _this.calendarPeriod.end = moment(csi.Until).toDate(); // moment(r2[0].until).toDate();
                    var dayInformation = r2[0];
                    _this.loadDayInformation(dayInformation);
                    deferred.resolve();
                });
                return deferred.promise();
            };
            manageDays.prototype.loadDayInformation = function (diList) {
                var _this = this;
                diList.forEach(function (value, index, array) {
                    _this.dayDictionary.setValue(value.day, value);
                });
            };
            manageDays.prototype.showForm = function () {
                var _this = this;
                var url = str.format("bookingadmin/get/blockedperiods/{0}", this.app.parameters.currentAbode.id);
                ajax.Get({ url: url }, false).then(function (d) {
                    //var bookingOpen = d.bookingOpen;
                    var mdm = new booking_1.manageDaysModel(d);
                    //mdm.isOpen = bookingOpen;
                    _this.vm = new booking_1.observableManageDaysModel(mdm);
                    var templateUrl = "booking/managedays";
                    wt.getTemplate({ ctx: _this, templateUrl: templateUrl }).then(function (r) {
                        var f = new forms.form(_this, {
                            modal: false,
                            title: "Manage Booking Days",
                            styleClasses: ["report-forms"],
                            okButton: null,
                            cancelButtonText: "Administration page",
                            additionalButtons: [
                                { text: "Home page", command: "back-to-site", position: 1 /* left */ }
                            ],
                        }, _this.vm);
                        f.setContentHtml(r.template);
                        f.open(function (ctx, f, cmd, data, ct) {
                            switch (cmd) {
                                case "remove-blocked-period":
                                    var id = parseInt($(ct).closest("tr").attr("data-id"));
                                    _this.removeBlockedPeriod(id).then(function () {
                                        _this.reloadCalendar().then(function () {
                                            f.close();
                                            var md = new manageDays(_this.app);
                                            md.start();
                                        });
                                    });
                                    break;
                                case "save-new-period":
                                    if (f.isValid()) {
                                        _this.saveBlockedPeriod(data.current).then(function (r) {
                                            if (r.success) {
                                                // reload this form
                                                f.close();
                                                var md = new manageDays(_this.app);
                                                md.start();
                                            }
                                            else {
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
                                    var index = new adminIndex(_this.app);
                                    index.start();
                                    break;
                                case "back-to-site":
                                    f.close();
                                    location.href = "/home";
                                    break;
                                case "close-online-booking":
                                    _this.setOnlineBooking(false).then(function () {
                                        _this.vm.isOpen(false);
                                    });
                                    break;
                                case "open-online-booking":
                                    _this.setOnlineBooking(true).then(function () {
                                        _this.vm.isOpen(true);
                                    });
                                    break;
                            }
                        }).then(function () {
                            var initialNumberOfMonths = _this.getCalendarMonthCount();
                            _this.addBookingCalendar(initialNumberOfMonths);
                        });
                    });
                });
            };
            manageDays.prototype.reloadCalendar = function () {
                var _this = this;
                var deferred = $.Deferred();
                var dayStatusUrl = str.format("bookingapi/calendar/{0}/status", this.app.parameters.currentAbode.id); // returns individual day status for every day
                ajax.Get({ url: dayStatusUrl }, false).then(function (di) {
                    var dayInformation = di;
                    _this.loadDayInformation(dayInformation);
                    $('#bookingCalendar').datepicker("refresh");
                    deferred.resolve();
                });
                return deferred.promise();
            };
            manageDays.prototype.removeBlockedPeriod = function (id) {
                var deferred = $.Deferred();
                var url = str.format("bookingadmin/delete/blockedperiod/{0}/{1}", this.app.parameters.currentAbode.id, id);
                ajax.Post({ url: url, data: null }).then(function () {
                    deferred.resolve();
                });
                return deferred.promise();
            };
            manageDays.prototype.saveBlockedPeriod = function (m) {
                var _this = this;
                var deferred = $.Deferred();
                //var endsOn = moment(m.newPeriodFrom).add(m.newPeriodDuration - 1, 'd').toDate()
                var endsOn = str.toMoment(m.newPeriodFrom).add(m.newPeriodDuration - 1, 'd').toDate();
                var from = str.toDateString(m.newPeriodFrom);
                var to = str.toDateString(endsOn);
                var abodeId = this.app.parameters.currentAbode.id;
                var url = str.format("bookingadmin/create/blockedperiod/{0}", abodeId);
                ajax.Post({ url: url, data: { from: from, to: to, remarks: m.newPeriodRemarks } }).then(function (r) {
                    if (r.success) {
                        _this.reloadCalendar().then(function () {
                            deferred.resolve({ success: true, message: null });
                        });
                    }
                    else {
                        deferred.resolve({ success: false, message: r.error });
                    }
                });
                return deferred.promise();
            };
            manageDays.prototype.setOnlineBooking = function (open) {
                var deferred = $.Deferred();
                var url = str.format("bookingadmin/onlinebooking/set/{0}", open);
                ajax.Post({ url: url, data: null }).then(function () {
                    deferred.resolve();
                });
                return deferred.promise();
            };
            return manageDays;
        }(adminSubapp));
        var editBookingResult = (function () {
            function editBookingResult() {
            }
            return editBookingResult;
        }());
        var bookingReport = (function (_super) {
            __extends(bookingReport, _super);
            function bookingReport(app) {
                var _this = _super.call(this, app) || this;
                _this.propertyInfo = new collections.Dictionary();
                _this.dataTable = null;
                return _this;
            }
            bookingReport.prototype.start = function (rt) {
                var _this = this;
                if (rt === void 0) { rt = bookingReportType.normal; }
                $.fn.dataTable.moment('DDMMMYYYY');
                var reportFormTemplate = "booking/bookingreportform";
                var reportTemplate = "booking/bookingreport";
                var dataurl = ""; //str.format("bookingadmin/get/bookings/{0}", this.app.parameters.currentAbode.id);
                var heading = ""; //"All Bookings";
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
                        var phoneNumberCellIndex = _this.findCellIndexInTemplate(template, "memberPhoneNumber");
                        _this.propertyInfo.setValue("memberPhoneNumber", phoneNumberCellIndex);
                        _this.propertyInfo.setValue("statusName", _this.findCellIndexInTemplate(template, "statusName"));
                        ajax.Get({ url: dataurl }, false).then(function (bookingList) {
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
                                }
                            }).then(function () {
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
                                oform.find("#booking-report-table button[data-table-cmd]").on("click", function (e) {
                                    debug.print("data-table-cmd");
                                    _this.embeddedButtonHandler(bookingList, e);
                                });
                                _this.dataTable = oform.find("#booking-report-table").DataTable({
                                    "columnDefs": [{ "type": "natural", targets: 0 }],
                                    pagingType: "simple",
                                    order: [[0, 'asc']]
                                });
                            });
                        });
                    });
                });
            };
            bookingReport.prototype.findCellIndexInTemplate = function (template, property) {
                var selector = "td:contains('{{" + property + "}}')";
                //var x = $(template).find("td:contains('{{memberPhoneNumber}}')");
                //$(x).closest("tr").find("td").index(x)
                var cell = $(template).find(selector);
                return $(cell).closest("tr").find("td").index(cell);
            };
            bookingReport.prototype.embeddedButtonHandler = function (bookingList, e) {
                var _this = this;
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
                        this.showSetPaidForm(booking, makeUnpaid).then(function (updated) {
                            if (updated) {
                                var row = _this.dataTable.row($(ct).closest("tr")[0]);
                                if (makeUnpaid) {
                                    $(row.node()).removeClass("is-paid");
                                }
                                else {
                                    $(row.node()).addClass("is-paid");
                                }
                            }
                        });
                        break;
                    case "edit-booking":
                        this.showEditBookingForm(booking).then(function (r) {
                            if (r.dataUpdated) {
                                booking.memberPhoneNumber = r.booking.memberPhoneNumber;
                                booking.notes = r.booking.notes;
                                var rowElement = $(ct).closest("tr");
                                var d = _this.dataTable.row(rowElement).data();
                                var pnIndex = _this.propertyInfo.getValue("memberPhoneNumber");
                                //debug.print("before change: {0}", d[pnIndex]);
                                d[pnIndex] = r.booking.memberPhoneNumber;
                                _this.dataTable.row(rowElement).data(d).draw();
                                $(rowElement).find("button[data-table-cmd]").on("click", function (e) {
                                    _this.embeddedButtonHandler(bookingList, e);
                                });
                                //var d2 = this.dataTable.row(rowElement).data();
                                //debug.print("after change: {0}", d2[pnIndex]);
                            }
                            else if (r.statusChanged) {
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
                                booking.statusName = _this.bookingStatusToString(booking.status);
                                var rowElement = $(ct).closest("tr");
                                var d = _this.dataTable.row(rowElement).data();
                                var snIndex = _this.propertyInfo.getValue("statusName");
                                var oldStatus = d[snIndex];
                                d[snIndex] = booking.statusName;
                                $(rowElement).removeClass("status-" + oldStatus).addClass("status-" + booking.statusName);
                                _this.dataTable.row(rowElement).data(d).draw();
                                //var cells = $(rowElement).find("td");
                                $(rowElement).find("button[data-table-cmd]").on("click", function (e) {
                                    _this.embeddedButtonHandler(bookingList, e);
                                });
                            }
                        });
                        break;
                }
            };
            bookingReport.prototype.bookingStatusToString = function (s) {
                switch (s) {
                    case 0 /* WaitingApproval */:
                        return "WaitingApproval";
                    case 3 /* Cancelled */:
                        return "Cancelled";
                    //case server.bookingStatus.AutoCancelled:
                    //    return "AutoCancelled";
                    case 2 /* Confirmed */:
                        return "Confirmed";
                    case 1 /* WaitingPayment */:
                        return "WaitingPayment";
                }
            };
            bookingReport.prototype.findBooking = function (list, id) {
                return list.filter(function (item) {
                    return item.bookingId === id;
                })[0];
            };
            bookingReport.prototype.showSetPaidForm = function (booking, makeUnpaid) {
                var _this = this;
                if (makeUnpaid === void 0) { makeUnpaid = false; }
                var deferred = $.Deferred();
                var setPaidFormTemplate = "booking/setpaidform";
                wt.getTemplate({ ctx: this, templateUrl: setPaidFormTemplate }).then(function (r) {
                    var bm = booking_1.factory.getObservableBookingModel(booking);
                    var spf = new forms.form(_this, {
                        initialWidth: 600,
                        modal: true,
                        styleClasses: configuration.getFormStyleClasses(),
                        title: str.format("Booking: {0}", booking.reference),
                        okButtonText: makeUnpaid ? "Set Not Paid" : "Set Paid"
                    }, bm);
                    spf.setContentHtml(r.template);
                    spf.open(function (ctx, f, cmd, data) {
                        switch (cmd) {
                            case "ok-command":
                                _this.changePaidState(booking, makeUnpaid ? false : true).then(function () {
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
            };
            bookingReport.prototype.showEditBookingForm = function (booking) {
                var _this = this;
                var result = new editBookingResult();
                result.dataUpdated = false;
                result.statusChanged = false;
                var deferred = $.Deferred();
                var editBookingFormTemplate = "booking/editBookingform";
                wt.getTemplate({ ctx: this, templateUrl: editBookingFormTemplate }).then(function (r) {
                    var bm = booking_1.factory.getObservableBookingModel(booking);
                    var options = {
                        initialWidth: 600,
                        modal: true,
                        styleClasses: configuration.getFormStyleClasses(),
                        title: str.format("Booking: {0}", booking.reference),
                        okButtonText: "Save Changes",
                    };
                    switch (booking.status) {
                        case 0 /* WaitingApproval */:
                            options.additionalButtons = [
                                { text: "Cancel Booking", command: "cancel-booking", position: 1 /* left */ },
                                { text: "Approve Booking", command: "approve-booking", position: 1 /* left */ },
                            ];
                            break;
                        case 1 /* WaitingPayment */:
                            options.additionalButtons = [
                                { text: "Cancel Booking", command: "cancel-booking", position: 1 /* left */ },
                            ];
                            break;
                        case 2 /* Confirmed */:
                            options.additionalButtons = [
                                { text: "Cancel Booking", command: "cancel-booking", position: 1 /* left */ },
                            ];
                            break;
                    }
                    var spf = new forms.form(_this, options, bm);
                    spf.setContentHtml(r.template);
                    spf.open(function (ctx, f, cmd, data) {
                        switch (cmd) {
                            case "ok-command":
                                _this.updateBooking(data.current).then(function () {
                                    result.dataUpdated = true;
                                    result.booking = data.current;
                                    if (result.booking.status != 3 /* Cancelled */) {
                                        f.enableCommand("cancel-booking");
                                        if (result.booking.status != 2 /* Confirmed */) {
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
                                _this.cancelBooking(data.current).then(function () {
                                    result.statusChanged = true;
                                    result.booking = data.current;
                                    f.setMessage("Booking cancelled");
                                });
                                break;
                            case "approve-booking":
                                f.disableCommand("approve-booking");
                                //data.current.status = server.bookingStatus.WaitingPayment;
                                _this.approveBooking(data.current).then(function () {
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
                    }, function (f, property) {
                        f.setMessage("");
                        f.disableCommand("cancel-booking");
                        f.disableCommand("approve-booking");
                    });
                });
                return deferred.promise();
            };
            bookingReport.prototype.cancelBooking = function (booking) {
                var deferred = $.Deferred();
                var url = str.format("bookingadmin/cancel/booking/{0}", booking.bookingId);
                ajax.Post({ url: url, data: null }).then(function () {
                    deferred.resolve();
                });
                return deferred.promise();
            };
            bookingReport.prototype.approveBooking = function (booking) {
                var deferred = $.Deferred();
                var url = str.format("bookingadmin/approve/booking/{0}", booking.bookingId);
                ajax.Post({ url: url, data: null }).then(function () {
                    deferred.resolve();
                });
                return deferred.promise();
            };
            //private changeStatus(booking: bookingModel): JQueryPromise<void> {
            //    var deferred = $.Deferred<void>();
            //    var url = str.format("bookingadmin/update/booking/{0}/status/{1}", booking.bookingId, booking.status);
            //    ajax.Post({ url: url, data: null }).then(() => {
            //        deferred.resolve();
            //    });
            //    return deferred.promise();
            //}
            bookingReport.prototype.updateBooking = function (booking) {
                var deferred = $.Deferred();
                var url = str.format("bookingadmin/update/booking");
                ajax.Post({ url: url, data: booking }).then(function () {
                    deferred.resolve();
                });
                return deferred.promise();
            };
            bookingReport.prototype.changePaidState = function (booking, paid) {
                var deferred = $.Deferred();
                var url = str.format("bookingadmin/update/booking/{0}/paidstate/{1}", booking.bookingId, paid);
                ajax.Post({ url: url, data: null }).then(function () {
                    deferred.resolve();
                });
                return deferred.promise();
            };
            return bookingReport;
        }(adminSubapp));
        var occupancyReport = (function (_super) {
            __extends(occupancyReport, _super);
            function occupancyReport(app) {
                return _super.call(this, app) || this;
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
        }(adminSubapp));
        var emailTemplates = (function (_super) {
            __extends(emailTemplates, _super);
            function emailTemplates(app) {
                return _super.call(this, app) || this;
            }
            emailTemplates.prototype.start = function () {
                var _this = this;
                var templateListUrl = "bookingadmin/get/emailtemplatelist";
                ajax.Get({ url: templateListUrl }).then(function (tl) {
                    var templateUrl = "booking/emailTemplate";
                    wt.getTemplate({ ctx: _this, templateUrl: templateUrl }).then(function (r) {
                        var etm = new booking_1.editTemplateModel(tl);
                        var vetm = new booking_1.observableEditTemplateModel(etm);
                        var f = new forms.form(_this, {
                            modal: false,
                            initialHeight: 500,
                            title: "Email Template Editor",
                            styleClasses: ["report-forms"],
                            cancelButtonText: "Administration page",
                            okButtonText: "Save Changes",
                            additionalButtons: [
                                { text: "Home page", command: "back-to-site", position: 1 /* left */ },
                                { text: "Help with templates ...", command: "template-key-words", position: 1 /* left */ }
                            ],
                        }, vetm);
                        f.setContentHtml(r.template);
                        f.open(function (ctx, f, cmd, data) {
                            switch (cmd) {
                                case "ok-command":
                                    if (f.isValid()) {
                                        _this.saveEmailTemplate(data.current.selectedTemplate, data.current.subjectText, data.current.bodyHtml).then(function () {
                                            f.setMessage("Changes saved");
                                        });
                                    }
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
                                case "template-key-words":
                                    _this.showKeyWords();
                                    break;
                            }
                        }, function (f, pn) {
                            if (pn === "selectedTemplate") {
                                f.setMessage('');
                                var emailTemplateName = vetm.selectedTemplate();
                                if (emailTemplateName !== undefined) {
                                    //debug.print("template {0} selected", vetm.selectedTemplate());
                                    f.find(".template-editor").removeClass("hidden");
                                    //f.find(".template-editor iframe").css("height", 320); // make this work dynamically!!!!
                                    var url = str.format("bookingadmin/get/emailtemplate/{0}", encodeURIComponent(vetm.selectedTemplate()));
                                    ajax.Get({ url: url }, false).then(function (r) {
                                        vetm.subjectText(r.subjectText);
                                        var editor = f.findRichTextEditor("bodyHtml");
                                        editor.setContent(r.bodyText);
                                        f.enableCommand("ok-command");
                                    });
                                }
                                else {
                                    f.find(".template-editor").addClass("hidden");
                                    f.disableCommand("ok-command");
                                }
                            }
                            else {
                                debug.print("property {0} changed", pn);
                            }
                        }).then(function () {
                            f.disableCommand("ok-command");
                        });
                    });
                });
            };
            emailTemplates.prototype.showKeyWords = function () {
                var _this = this;
                var templateurl = "booking/emailkeywords";
                wt.getTemplate({ ctx: this, templateUrl: templateurl }).then(function (r) {
                    var f = new forms.form(_this, {
                        modal: true,
                        title: "Email Template Keywords",
                        styleClasses: ["report-forms"],
                        okButtonText: "Close",
                        cancelButton: null,
                        initialHeight: 560,
                        initialWidth: 750
                    }, null);
                    f.setContentHtml(r.template);
                    f.open(function (ctx, f, cmd, data) {
                        f.close();
                    });
                });
            };
            emailTemplates.prototype.saveEmailTemplate = function (template, subjectText, bodyHtml) {
                var deferred = $.Deferred();
                var url = "bookingadmin/update/emailTemplate";
                var data = { template: template, subjectText: subjectText, bodyText: bodyHtml };
                ajax.Post({ url: url, data: data }).then(function () {
                    deferred.resolve();
                });
                return deferred.promise();
            };
            return emailTemplates;
        }(adminSubapp));
    })(booking = fastnet.booking || (fastnet.booking = {}));
})(fastnet || (fastnet = {}));
//# sourceMappingURL=bookingAdmin.js.map