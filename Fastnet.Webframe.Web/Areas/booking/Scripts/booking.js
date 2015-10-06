/// <reference path="../../../scripts/typings/jquery/jquery.d.ts" />
/// <reference path="../../../scripts/typings/jqueryui/jqueryui.d.ts" />
/// <reference path="../../../scripts/typings/moment/moment.d.ts" />
/// <reference path="../../../scripts/typings/knockout/knockout.d.ts" />
/// <reference path="../../../scripts/collections/collections.d.ts" />
/// <reference path="../../../../fastnet.webframe.bookingdata/transferobjects/calendarsetup.cs.d.ts" />
var fastnet;
(function (fastnet) {
    var booking;
    (function (booking) {
        var ajax = fastnet.util.ajax;
        var debug = fastnet.util.debug;
        var str = fastnet.util.str;
        var wt = fastnet.web.tools;
        var forms = fastnet.forms;
        var h$ = fastnet.util.helper;
        var configuration = (function () {
            function configuration() {
            }
            configuration.getFormStyleClasses = function () {
                return ["booking-forms"];
            };
            return configuration;
        })();
        var bookingAppValidations = (function () {
            function bookingAppValidations() {
            }
            //public static validateBookingEndDate2: forms.knockoutAsyncValidator = function (val, params, callback): void {
            //    var startDate: Date = params;
            //    var startMoment = moment(startDate);
            //    var endMoment = moment(val);
            //    debugger;
            //    callback({ isValid: false, message: "some message or other" });
            //}
            bookingAppValidations.GetValidators = function () {
                var rules = [];
                rules.push({ name: "bookingEndDate", async: false, validator: bookingAppValidations.validateBookingEndDate, message: "This end date is not valid" });
                rules.push({ name: "dateGreaterThan", async: false, validator: bookingAppValidations.validateDateGreaterThan, message: "This date is not valid" });
                //rules.push({ name: "bookingEndDate2", async: true, validator: bookingAppValidations.validateBookingEndDate2, message: "This end date is not valid" });
                return rules;
            };
            bookingAppValidations.validateDateGreaterThan = function (val, params) {
                var refDate = str.toMoment(params);
                var thisDate = str.toMoment(val);
                var diff = thisDate.diff(refDate, 'd');
                return diff >= 0;
            };
            bookingAppValidations.validateBookingEndDate = function (val, params) {
                if (h$.isNullOrUndefined(val)) {
                    return true;
                }
                var startDate = ko.unwrap(params.startDate);
                if (h$.isNullOrUndefined(startDate)) {
                    this.message = "No end date is valid without a start date";
                    return false;
                }
                var startMoment = moment(startDate);
                var endMoment = moment(val);
                var d = endMoment.diff(startMoment, 'd');
                if (d > 0) {
                    return true;
                }
                else {
                    this.message = "End date must be after start date";
                    return false;
                }
            };
            return bookingAppValidations;
        })();
        var bookingApp = (function () {
            function bookingApp() {
            }
            bookingApp.prototype.start = function () {
                var _this = this;
                var config = {
                    modelessContainer: "booking-interaction",
                    additionalValidations: bookingAppValidations.GetValidators()
                };
                this.today = new Date();
                forms.form.initialise(config);
                this.dayDictionary = new collections.Dictionary();
                this.dayDictionaryMonthsLoaded = new collections.Dictionary();
                this.currentMember = {
                    Anonymous: true,
                    Fullname: null,
                    MemberId: null,
                    OnBehalfOfMemberId: null,
                    BookingPermission: 0 /* Disallowed */,
                    Explanation: "Not logged in",
                    MobileNumber: ""
                };
                this.calendarPeriod = { start: null, end: null };
                this.loadInitialisationData().then(function () {
                    _this.setMember();
                    var initialNumberOfMonths = _this.getCalendarMonthCount();
                    _this.addBookingCalendar(initialNumberOfMonths);
                    //var initialNumberOfMonths = this.addBookingCalendar();
                    //this.loadDayDictionaryInSteps(this.calendarPeriod.start, initialNumberOfMonths, () => {
                    //    //debugger;
                    //});
                });
            };
            bookingApp.prototype.loadInitialisationData = function () {
                var _this = this;
                var deferred = $.Deferred();
                var parametersUrl = "bookingapi/parameters";
                ajax.Get({ url: parametersUrl }, false).then(function (p) {
                    _this.bookingParameters = booking.factory.getParameters(p); // p;
                    //this.bookingParameters.setFromJSON(p);
                    var abodeId = _this.bookingParameters.currentAbode.id;
                    var calendarInfoUrl = str.format("bookingapi/calendar/{0}/setup/info", abodeId);
                    var memberInfoUrl = "bookingapi/member";
                    var dayStatusUrl = str.format("bookingapi/calendar/{0}/status", _this.bookingParameters.currentAbode.id);
                    $.when(ajax.Get({ url: memberInfoUrl }, false), ajax.Get({ url: calendarInfoUrl }, false), ajax.Get({ url: dayStatusUrl }, false)).then(function (r1, r2, r3) {
                        _this.currentMember = r1[0];
                        var csi = r2[0];
                        _this.today = moment(csi.Today).toDate();
                        _this.calendarPeriod.start = moment(csi.StartAt).toDate(); // moment(r2[0].startAt).toDate();
                        _this.calendarPeriod.end = moment(csi.Until).toDate(); // moment(r2[0].until).toDate();
                        var dayInformation = r3[0];
                        _this.loadDayInformation(dayInformation);
                        deferred.resolve();
                    });
                });
                return deferred.promise();
            };
            bookingApp.prototype.loadDayInformation = function (diList) {
                var _this = this;
                diList.forEach(function (value, index, array) {
                    _this.dayDictionary.setValue(value.day, value);
                });
            };
            //private loadDayDictionaryInSteps(startAt: Date, numberOfMonthsToLoad: number, afterLoad: callback) {
            //    var lastMonth = false;
            //    var sd = moment(startAt);
            //    var ed = moment(this.calendarPeriod.end);
            //    var year = sd.year();
            //    var month = sd.month() + 1;
            //    var lyear = ed.year();
            //    var lmonth = ed.month() + 1;
            //    this.loadDayDictionaryForMonth(this, { year: year, month: month }, numberOfMonthsToLoad,
            //        (mt: monthTuple) => {
            //            //$('#bookingCalendar').datepicker('refresh');
            //            var dt = moment(new Date(mt.year, mt.month - 1, 1)).add(1, 'M');
            //            var y = dt.year();
            //            var m = dt.month() + 1;
            //            if (y > lyear || (y === lyear && m > lmonth)) {
            //                return null;
            //            }
            //            return { year: y, month: m };
            //        }, () => {
            //            afterLoad();
            //        });
            //}
            //private loadDayDictionaryForMonth(app: bookingApp, month: monthTuple, numberOfMonthsToLoad: number, getNextMonth: getMonthTupleCallback, afterLoad: callback) {
            //    function doNext() {
            //        var next = getNextMonth(month);
            //        if (next == null) {// || numberOfMonthsToLoad < 1) {
            //            afterLoad();
            //        }
            //        else {
            //            app.loadDayDictionaryForMonth(app, next, numberOfMonthsToLoad - 1, getNextMonth, afterLoad);
            //        }
            //    }
            //    var dayStatusForMonthUrl = str.format("bookingapi/calendar/{2}/status/month/{0}/{1}", month.year, month.month, this.bookingParameters.currentAbode.id);
            //    var monthKey = str.format("{0}-{1}", month.year, month.month);
            //    var alreadyDone = app.dayDictionaryMonthsLoaded.containsKey(monthKey) && app.dayDictionaryMonthsLoaded.getValue(monthKey);
            //    if (!alreadyDone) {
            //        $.when(ajax.Get({ url: dayStatusForMonthUrl }, false)).then((r: server.dayInformation[]) => {
            //            //var ds: DayInformation[] = r;
            //            r.forEach((value, index, array) => {
            //                //app.dayDictionary.setValue(moment(value.day, "DDMMMYYYY").format("DDMMMYYYY"), value);
            //                app.dayDictionary.setValue(value.day, value);
            //            });
            //            app.dayDictionaryMonthsLoaded.setValue(monthKey, true);
            //            app.refreshBookingCalendar();
            //            doNext();
            //        });
            //    } else {
            //        doNext();
            //    }
            //}
            bookingApp.prototype.refreshBookingCalendar = function () {
                $('#bookingCalendar').datepicker("refresh");
                $(this).trigger("refresh-calendar");
            };
            bookingApp.prototype.getCalendarMonthCount = function () {
                var fw = $(window).width();
                var w = fw - 450;
                var factor = 220;
                var n = 4;
                if (w <= (factor * 2)) {
                    n = Math.round((w + (factor / 2)) / factor) + 1;
                }
                //var cn = $('#bookingCalendar').datepicker("option", "numberOfMonths");
                //if (n != cn) {
                //    $('#bookingCalendar').datepicker("option", "numberOfMonths", n);
                //}
                return n;
            };
            bookingApp.prototype.setCalendarMonthCount = function () {
                //var fw = $(window).width();
                //var w = fw - 450;
                //var factor = 220;
                //var n = 4;
                //if (w <= (factor * 2)) {
                //    n = Math.round((w + (factor / 2)) / factor) + 1;
                //}
                var n = this.getCalendarMonthCount();
                var cn = $('#bookingCalendar').datepicker("option", "numberOfMonths");
                if (n != cn) {
                    $('#bookingCalendar').datepicker("option", "numberOfMonths", n);
                }
                return n;
            };
            bookingApp.prototype.calendarBeforeShowDate = function (d) {
                //debug.print("cbsd: {0}", d);
                var day = moment(d);
                if (day.isBefore(this.calendarPeriod.start) || day.isAfter(this.calendarPeriod.end)) {
                    return [false, "blocked", "Out of range"];
                }
                if (this.dayDictionary.isEmpty()) {
                    //debug.print("day dictionary is empty");
                    return [false, "blocked", "not ready"];
                }
                else {
                    //if (this.dayDictionary.containsKey(day.format("DDMMMYYYY"))) {
                    if (this.dayDictionary.containsKey(str.toDateString(day))) {
                        //var di = this.dayDictionary.getValue(day.format("DDMMMYYYY"));
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
                                //default:
                                //    r = [true, "free", "default pop-up"];
                                break;
                        }
                        return r;
                    }
                    else {
                        //debug.print("day dictionary does not contain key {0}", day.format("DDMMMYYYY"));
                        return [true, "free", "This day is free"];
                    }
                }
            };
            //public calendarOnChangeMonth(year, month) {
            //    var sd = new Date(year, month, 1);
            //    this.loadDayDictionaryInSteps(sd, 3, () => {
            //    });
            //}
            bookingApp.prototype.addBookingCalendar = function (nm) {
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
            bookingApp.prototype.setMember = function () {
                var _this = this;
                if (this.currentMember.Anonymous) {
                    var lm = new LoginManager();
                    lm.start(function () { _this.retryCredentials(); });
                }
                else {
                    $(".booking-interaction").off().empty();
                    $(".login-name").off().text(this.currentMember.Fullname);
                    switch (this.currentMember.BookingPermission) {
                        case 0 /* Disallowed */:
                            var html = str.format("<div class='booking-disallowed'>Booking is currently unavailable:<div class='explanation'>{0}</div></div>", this.currentMember.Explanation);
                            $(".booking-interaction").empty().append($(html));
                            break;
                        case 2 /* WithConfirmation */:
                        case 1 /* WithoutConfirmation */:
                        default:
                            $(".booking-interaction").empty();
                            var bd = new bookDates();
                            bd.start(this);
                            break;
                    }
                }
            };
            bookingApp.prototype.retryCredentials = function () {
                var _this = this;
                var memberInfoUrl = "bookingapi/member";
                ajax.Get({ url: memberInfoUrl }, false).then(function (r) {
                    _this.currentMember = r;
                    _this.setMember();
                });
            };
            return bookingApp;
        })();
        booking.bookingApp = bookingApp;
        var loginModels = fastnet.booking.login;
        var LoginManager = (function () {
            function LoginManager() {
                this.lastUserKey = "last-successful-user";
                //private loginInvitation: string =
                //`<div class='login-invitation'>
                //    <div>Online booking is available to members only. If you are a member please <a href='#' data-cmd='login-cmd'>login</a> first.
                //    If you are not a member, please <a href='/register' >register</a>.</div>
                //    <div><button class='btn btn-primary' data-cmd='test-form' >Test Forms</button></div>
                // </div>`;
                this.loginInvitation = "<div class='login-invitation'>\n            <div>Online booking is available to members only. If you are a member please <a href='#' data-cmd='login-cmd'>login</a> first.\n            If you are not a member, please <a href='/register' >register</a>.</div>\n         </div>";
            }
            LoginManager.prototype.start = function (cb) {
                var _this = this;
                this.callback = cb;
                $(".login-name").empty();
                $(".booking-interaction").append($(this.loginInvitation));
                $(".login-invitation a[data-cmd]").on("click", function (e) {
                    //var cmd: string = $(e.target).attr("data-cmd");
                    var cmd = $(e.currentTarget).attr("data-cmd");
                    switch (cmd) {
                        case "login-cmd":
                            _this.onLoginRequested();
                            break;
                    }
                });
                //var t = new fastnet.tests();
                //t.start();
            };
            LoginManager.prototype.login = function (f, data) {
                var _this = this;
                var result = false;
                ajax.Post({ url: "user/login", data: { emailAddress: data.current.email, password: data.current.password } })
                    .then(function (r) {
                    if (r.Success) {
                        f.close();
                        h$.setLocalData(_this.lastUserKey, data.current.email);
                        _this.callback();
                    }
                    else {
                        f.find(".login-failure").text(r.Error);
                    }
                });
                return result;
            };
            LoginManager.prototype.onLoginRequested = function () {
                debug.print("onLoginRequested");
                this.model = new loginModels.credentials();
                var lastUser = h$.getLocalData(this.lastUserKey);
                this.model.email = lastUser === null ? "" : lastUser;
                this.model.password = "";
                var observableModel = new loginModels.observableCredentials(this.model);
                var loginForm = new forms.form(this, {
                    modal: true,
                    title: "Login",
                    styleClasses: configuration.getFormStyleClasses(),
                    okButtonText: "Login"
                }, observableModel);
                var loginFormTemplateUrl = "booking/login";
                wt.getTemplate({ ctx: this, templateUrl: loginFormTemplateUrl }).then(function (r) {
                    var template = r.template;
                    loginForm.setContentHtml(template);
                    loginForm.find(".login-failure").empty();
                    loginForm.open(function (ctx, f, cmd, data) {
                        switch (cmd) {
                            case "cancel-command":
                                f.close();
                                break;
                            case "ok-command":
                                if (f.isValid()) {
                                    ctx.login(f, data);
                                }
                                break;
                        }
                    });
                    //loginForm.disableCommand("ok-command");
                });
            };
            return LoginManager;
        })();
        var bookingModels = fastnet.booking; // bookingVM;
        var bookDates = (function () {
            function bookDates() {
            }
            bookDates.prototype.start = function (app) {
                var _this = this;
                this.bookingApp = app;
                this.subscribeToAppEvents();
                this.dpOptions = {
                    minDate: app.calendarPeriod.start,
                    maxDate: app.calendarPeriod.end,
                    beforeShow: this.beforeShowingDatePicker,
                    beforeShowDay: function (d) { return _this.beforeShowDay(d); },
                    onChangeMonthYear: function (m, y) {
                        //debug.print("onChangeMonthYear: month {0} year {1}", m, y);
                        //app.calendarOnChangeMonth(m, y);
                    },
                    // onSelect: this.onSelectDate,
                    dateFormat: 'dMyy'
                };
                var shortTermBookingAllowed = this.bookingApp.bookingParameters.paymentGatewayAvailable;
                var shortBookingInterval = this.getShortTermBookingInterval();
                var today = str.toMoment(this.bookingApp.bookingParameters.today);
                this.step1_model = new bookingModels.request_step1(today, shortTermBookingAllowed, shortBookingInterval);
                this.step1_model.mobileNumber = app.currentMember.MobileNumber;
                this.step1_vm = new bookingModels.observableRequest_step1(this.step1_model, { maximumNumberOfPeople: this.bookingApp.bookingParameters.maximumOccupants });
                this.step1();
            };
            bookDates.prototype.subscribeToAppEvents = function () {
                $(this.bookingApp).on("refresh-calendar", function (event) {
                    //debug.print("booking app calendar refresh");
                    $("#startDatePicker").datepicker("refresh");
                });
            };
            bookDates.prototype.unSubscribeToAppEvents = function () {
                $(this.bookingApp).off("refresh-calendar");
            };
            bookDates.prototype.beforeShowDay = function (d) {
                var r = this.bookingApp.calendarBeforeShowDate(d);
                if (r[0] === false) {
                    var pd = moment(d).add(-1, 'd').toDate();
                    var pr = this.bookingApp.calendarBeforeShowDate(pd);
                    if (pr[0] == true) {
                        r[1] = r[1] + " allow";
                        r[0] = true;
                    }
                }
                return r;
            };
            bookDates.prototype.step1 = function () {
                var _this = this;
                this.step2_model = null;
                this.step2_vm = null;
                this.step3_model = null;
                this.step3_vm = null;
                var baf_step1 = new forms.form(this, {
                    modal: false,
                    title: "Select Dates",
                    styleClasses: configuration.getFormStyleClasses(),
                    datepickerOptions: this.dpOptions,
                    okButtonText: "Next",
                    cancelButtonText: "Clear"
                }, this.step1_vm);
                var bafTemplateUrl = "booking/request-step1";
                wt.getTemplate({ ctx: this, templateUrl: bafTemplateUrl }).then(function (r) {
                    baf_step1.setContentHtml(r.template);
                    baf_step1.open(function (ctx, f, cmd, data) {
                        switch (cmd) {
                            case "cancel-command":
                                //f.close();
                                //this.start(this.bookingApp);
                                _this.step1_vm.reset();
                                break;
                            case "ok-command":
                                if (f.isValid()) {
                                    if (_this.canGoToStep2(data.current)) {
                                    }
                                }
                                break;
                        }
                    });
                });
            };
            bookDates.prototype.step2 = function (choices) {
                var _this = this;
                this.step3_model = null;
                this.step3_vm = null;
                var sd = this.step1_vm.startDate();
                var ed = this.step1_vm.endDate();
                var np = parseInt(this.step1_vm.numberOfPeople());
                this.step2_model = new booking.request_step2();
                this.step2_model.choices = choices;
                this.step2_vm = new booking.observableRequest_step2(this.step2_model, sd, ed, np);
                var buttons = [
                    {
                        text: "Back",
                        command: "back-command",
                        position: 0 /* right */
                    }
                ];
                var baf_step2 = new forms.form(this, {
                    modal: false,
                    title: "Choose Alternative",
                    styleClasses: configuration.getFormStyleClasses(),
                    datepickerOptions: this.dpOptions,
                    okButtonText: "Next",
                    cancelButtonText: "Cancel",
                    additionalButtons: buttons
                }, this.step2_vm);
                var bafTemplateUrl = "booking/request-step2";
                wt.getTemplate({ ctx: this, templateUrl: bafTemplateUrl }).then(function (r) {
                    baf_step2.setContentHtml(r.template);
                    baf_step2.open(function (ctx, f, cmd, data) {
                        switch (cmd) {
                            case "cancel-command":
                                _this.step1_vm.reset();
                                _this.step1();
                                break;
                            case "back-command":
                                _this.step1();
                                break;
                            case "ok-command":
                                var item = parseInt(_this.step2_vm.selected());
                                var choice = _this.step2_model.choices[item - 1];
                                //debug.print("choice is {0} {1}", choice.choiceNumber, choice.description);
                                _this.step3(choice);
                                break;
                        }
                    });
                });
            };
            bookDates.prototype.step3 = function (choice) {
                var _this = this;
                var td = str.toMoment(this.bookingApp.bookingParameters.today);
                var sd = this.step1_vm.startDate();
                var ed = this.step1_vm.endDate();
                var np = parseInt(this.step1_vm.numberOfPeople());
                var daysToStart = str.toMoment(sd).diff(td, 'd');
                var shortBookingInterval = this.getShortTermBookingInterval();
                var isShortTerm = daysToStart < shortBookingInterval;
                this.step3_model = new booking.request_step3(sd, ed, choice, this.bookingApp.bookingParameters.termsAndConditionsUrl, isShortTerm, shortBookingInterval, this.bookingApp.bookingParameters.paymentGatewayAvailable);
                this.step3_vm = new booking.observableRequest_step3(this.step3_model);
                var buttons = [
                    {
                        text: "Back",
                        command: "back-command",
                        position: 0 /* right */
                    }
                ];
                var baf_step3 = new forms.form(this, {
                    modal: false,
                    title: "Confirm Booking",
                    styleClasses: configuration.getFormStyleClasses(),
                    datepickerOptions: this.dpOptions,
                    okButtonText: "Next",
                    cancelButtonText: "Cancel",
                    additionalButtons: buttons
                }, this.step3_vm);
                var bafTemplateUrl = "booking/request-step3";
                wt.getTemplate({ ctx: this, templateUrl: bafTemplateUrl }).then(function (r) {
                    baf_step3.setContentHtml(r.template);
                    baf_step3.open(function (ctx, f, cmd, data) {
                        switch (cmd) {
                            case "show-tc":
                                _this.showTC();
                                break;
                            case "cancel-command":
                                _this.step1_vm.reset();
                                _this.step1();
                                break;
                            case "back-command":
                                if (_this.step2_model !== null) {
                                    _this.step2(_this.step2_model.choices);
                                }
                                else {
                                    _this.step1();
                                }
                                break;
                            case "ok-command":
                                if (f.isValid()) {
                                    _this.saveBookingChoice(data.current);
                                }
                                break;
                        }
                    });
                });
            };
            bookDates.prototype.saveBookingChoice = function (model) {
                var _this = this;
                var tempHtml = "<div>At this point the booking will be saved and message appear here that a confirmation email has ben sent ...</div>\n                                <div> ... when I've done the coding!</div>";
                var choice = model.choice;
                var cf = new forms.form(this, {
                    modal: true,
                    title: "Booking Confirmed",
                    styleClasses: configuration.getFormStyleClasses(),
                    datepickerOptions: this.dpOptions,
                    cancelButton: null
                }, null);
                cf.setContentHtml(tempHtml);
                cf.open(function (ctx, f, cmd, data) {
                    f.close();
                    _this.step1_vm.reset();
                    _this.step1();
                });
            };
            bookDates.prototype.getShortTermBookingInterval = function () {
                //ToDo: implement a way to avoid hard coding the cast to dwhParameters)
                var dwhParameters = this.bookingApp.bookingParameters;
                return dwhParameters.shortBookingInterval;
            };
            bookDates.prototype.beforeShowingDatePicker = function (input, inst) {
                // $("#startDatePicker").datepicker("refresh");
                if (input.id === "startDatePicker") {
                    $("#ui-datepicker-div").addClass("booking-month").removeClass("end-month").addClass("start-month");
                }
                else if (input.id === "endDatePicker") {
                    $("#ui-datepicker-div").addClass("booking-month").removeClass("start-month").addClass("end-month");
                }
                return null;
            };
            bookDates.prototype.canGoToStep2 = function (model) {
                var _this = this;
                var sd = str.toDateString(model.startDate);
                var ed = str.toDateString(model.endDate);
                var url = str.format("bookingapi/get/choices/{0}/{1}/{2}/{3}", this.bookingApp.bookingParameters.currentAbode.id, sd, ed, model.numberOfPeople);
                ajax.Get({ url: url }, false).then(function (r) {
                    if (!r.success) {
                        debug.print(r.explanation);
                        forms.messageBox.show(r.explanation).then(function () {
                            _this.step1();
                        });
                    }
                    else {
                        if (r.choices.length === 1) {
                            _this.step3(r.choices[0]);
                        }
                        else {
                            _this.step2(r.choices);
                        }
                    }
                });
                return false;
            };
            bookDates.prototype.showTC = function () {
                var _this = this;
                var url = str.format("pageapi/{0}", this.bookingApp.bookingParameters.termsAndConditionsUrl);
                ajax.Get({ url: url }, true).then(function (r) {
                    var tcf = new forms.form(_this, {
                        modal: true,
                        initialWidth: 600,
                        initialHeight: 300,
                        title: "Terms and Conditions",
                        styleClasses: configuration.getFormStyleClasses(),
                        datepickerOptions: _this.dpOptions,
                        cancelButton: null
                    }, null);
                    tcf.setContentHtml(r.HtmlText);
                    tcf.open(function (ctx, f, cmd, data) {
                    });
                });
            };
            return bookDates;
        })();
    })(booking = fastnet.booking || (fastnet.booking = {}));
})(fastnet || (fastnet = {}));
