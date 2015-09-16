/// <reference path="../../../scripts/typings/jquery/jquery.d.ts" />
/// <reference path="../../../scripts/typings/jqueryui/jqueryui.d.ts" />
/// <reference path="../../../scripts/typings/moment/moment.d.ts" />
/// <reference path="../../../scripts/typings/knockout/knockout.d.ts" />
/// <reference path="../../../scripts/collections/collections.d.ts" />


module fastnet {
    export module booking {
        import ajax = fastnet.util.ajax;
        import debug = fastnet.util.debug;
        import str = fastnet.util.str;
        import wt = fastnet.web.tools;
        import forms = fastnet.forms;
        import h$ = fastnet.util.helper;
        interface monthTuple {
            year: number;
            month: number;
        }
        //interface member {
        //    Anonymous: boolean;
        //    MemberId?: string;
        //    Fullname?: string;
        //}
        export interface period {
            start: Date;
            end: Date;
        }
        interface callback {
            (): void;
        }
        interface getMonthTupleCallback {
            (mt: monthTuple): monthTuple;
        }
        class configuration {
            public static getFormStyleClasses(): string[] {
                return ["booking-forms"];
            }
        }
        class bookingAppValidations {
            public static validateBookingEndDate: forms.knockoutValidator = function (val, params): boolean {
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
                } else {
                    this.message = "End date must be after start date";
                    return false;
                }
            }
            public static validateBookingEndDate2: forms.knockoutAsyncValidator = function (val, params, callback): void {
                var startDate: Date = params;
                var startMoment = moment(startDate);
                var endMoment = moment(val);
                debugger;
                callback({ isValid: false, message: "some message or other" });
            }
            public static GetValidators() {
                var rules: any[] = [];
                rules.push({ name: "bookingEndDate", async: false, validator: bookingAppValidations.validateBookingEndDate, message: "This end date is not valid" });
                rules.push({ name: "bookingEndDate2", async: true, validator: bookingAppValidations.validateBookingEndDate2, message: "This end date is not valid" });
                return rules;
            }
        }
        // export class bookingParameters implements server.bookingParameters {

        export class bookingApp {
            private dayDictionary: collections.Dictionary<string, server.dayInformation>;
            private dayDictionaryMonthsLoaded: collections.Dictionary<string, boolean>;
            public currentMember: server.MemberInfo;
            public calendarPeriod: period;
            public bookingParameters: parameters;// server.bookingParameters;
            public start(): void {
                var config: forms.configuration = {
                    modelessContainer: "booking-interaction",
                    additionalValidations: bookingAppValidations.GetValidators()
                };
                //var today = new Date();
                //debug.print(str.toDateString(today));
                //debug.print(str.toDateString(moment(today)));
                //debugger;
                forms.form.initialise(config);
                this.dayDictionary = new collections.Dictionary<string, server.dayInformation>();
                this.dayDictionaryMonthsLoaded = new collections.Dictionary<string, boolean>();
                this.currentMember = {
                    Anonymous: true,
                    Fullname: null,
                    MemberId: null,
                    OnBehalfOfMemberId: null,
                    BookingPermission: server.BookingPermissions.Disallowed,
                    Explanation: "Not logged in",
                    MobileNumber: ""
                };
                this.calendarPeriod = { start: null, end: null };
                this.loadInitialisationData().then(() => {
                    this.setMember();
                    var initialNumberOfMonths = this.addBookingCalendar();
                    this.loadDayDictionaryInSteps(this.calendarPeriod.start, initialNumberOfMonths, () => {
                        //debugger;
                    });
                });
            }
            private loadInitialisationData(): JQueryPromise<void> {
                var deferred = $.Deferred<void>();
                var parametersUrl = "bookingapi/parameters";
                ajax.Get({ url: parametersUrl }, false).then((p: server.bookingParameters) => {
                    this.bookingParameters = factory.getParameters(p);// p;
                    //this.bookingParameters.setFromJSON(p);
                    var abodeId = this.bookingParameters.currentAbode.id;
                    var calendarInfoUrl = str.format("bookingapi/calendar/{0}/setup/info", abodeId);
                    var memberInfoUrl = "bookingapi/member";
                    $.when(
                        ajax.Get({ url: memberInfoUrl }, false),
                        ajax.Get({ url: calendarInfoUrl }, false)
                        ).then((r1, r2, r3) => {
                            this.currentMember = <server.MemberInfo>r1[0];
                            var csi: bookingData.calendarSetup = r2[0];
                            this.calendarPeriod.start = moment(csi.StartAt).toDate();// moment(r2[0].startAt).toDate();
                            this.calendarPeriod.end = moment(csi.Until).toDate();// moment(r2[0].until).toDate();
                            //this.bookingParameters = <server.BookingParameters>r3[0];
                            deferred.resolve();
                        });
                });
                return deferred.promise();
            }
            private loadDayDictionaryInSteps(startAt: Date, numberOfMonthsToLoad: number, afterLoad: callback) {
                var lastMonth = false;
                var sd = moment(startAt);
                var ed = moment(this.calendarPeriod.end);
                var year = sd.year();
                var month = sd.month() + 1;
                var lyear = ed.year();
                var lmonth = ed.month() + 1;
                this.loadDayDictionaryForMonth(this, { year: year, month: month }, numberOfMonthsToLoad,
                    (mt: monthTuple) => {
                        //$('#bookingCalendar').datepicker('refresh');
                        var dt = moment(new Date(mt.year, mt.month - 1, 1)).add(1, 'M');
                        var y = dt.year();
                        var m = dt.month() + 1;
                        if (y > lyear || (y === lyear && m > lmonth)) {
                            return null;
                        }
                        return { year: y, month: m };
                    }, () => {
                        afterLoad();
                    });
            }
            private loadDayDictionaryForMonth(app: bookingApp, month: monthTuple, numberOfMonthsToLoad: number, getNextMonth: getMonthTupleCallback, afterLoad: callback) {
                function doNext() {
                    var next = getNextMonth(month);
                    if (next == null) {// || numberOfMonthsToLoad < 1) {
                        afterLoad();
                    }
                    else {
                        app.loadDayDictionaryForMonth(app, next, numberOfMonthsToLoad - 1, getNextMonth, afterLoad);
                    }
                }
                var dayStatusForMonthUrl = str.format("bookingapi/calendar/{2}/status/month/{0}/{1}", month.year, month.month, this.bookingParameters.currentAbode.id);
                var monthKey = str.format("{0}-{1}", month.year, month.month);
                var alreadyDone = app.dayDictionaryMonthsLoaded.containsKey(monthKey) && app.dayDictionaryMonthsLoaded.getValue(monthKey);
                if (!alreadyDone) {
                    $.when(ajax.Get({ url: dayStatusForMonthUrl }, false)).then((r: server.dayInformation[]) => {
                        //var ds: DayInformation[] = r;
                        r.forEach((value, index, array) => {
                            //app.dayDictionary.setValue(moment(value.day, "DDMMMYYYY").format("DDMMMYYYY"), value);
                            app.dayDictionary.setValue(value.day, value);
                        });
                        app.dayDictionaryMonthsLoaded.setValue(monthKey, true);
                        app.refreshBookingCalendar();
                        doNext();
                    });
                } else {
                    doNext();
                }
            }
            private refreshBookingCalendar() {
                $('#bookingCalendar').datepicker("refresh");
                $(this).trigger("refresh-calendar");
            }
            private setCalendarMonthCount(): number {
                var fw = $(window).width();
                var w = fw - 450;
                var factor = 220;
                var n = 4;
                if (w <= (factor * 2)) {
                    n = Math.round((w + (factor / 2)) / factor) + 1;
                }
                var cn = $('#bookingCalendar').datepicker("option", "numberOfMonths");
                if (n != cn) {
                    $('#bookingCalendar').datepicker("option", "numberOfMonths", n);
                }
                return n;
            }
            public calendarBeforeShowDate(d): any[] {
                //debug.print("cbsd: {0}", d);
                var day: moment.Moment = moment(d);
                if (day.isBefore(this.calendarPeriod.start) || day.isAfter(this.calendarPeriod.end)) {
                    return [false, "blocked", "Out of range"];
                }
                if (this.dayDictionary.isEmpty()) {
                    //debug.print("day dictionary is empty");
                    return [false, "blocked", "not ready"];
                } else {
                    //if (this.dayDictionary.containsKey(day.format("DDMMMYYYY"))) {
                    if (this.dayDictionary.containsKey(str.toDateString(day))) {
                        //var di = this.dayDictionary.getValue(day.format("DDMMMYYYY"));
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
                        //debug.print("day dictionary does not contain key {0}", day.format("DDMMMYYYY"));
                        return [false, "blocked", "not ready"];
                    }
                }
            }
            public calendarOnChangeMonth(year, month) {
                var sd = new Date(year, month, 1);
                this.loadDayDictionaryInSteps(sd, 3, () => {
                });
            }
            private addBookingCalendar(): number {
                $('#bookingCalendar').datepicker({
                    numberOfMonths: 4,
                    minDate: this.calendarPeriod.start,
                    maxDate: this.calendarPeriod.end,
                    beforeShowDay: (d) => { return this.calendarBeforeShowDate(d); },// this.calendarBeforeShowDate ,
                    onChangeMonthYear: (m, y) => {
                        //this.calendarOnChangeMonth(m, y);
                    },                    
                    //onSelect: this.BookingDateSelected,
                    dateFormat: 'DD d M yy'
                }).val('');
                window.onresize = (e) => {
                    this.setCalendarMonthCount();
                };
                return this.setCalendarMonthCount();
            }
            private setMember(): void {
                if (this.currentMember.Anonymous) {
                    var lm = new LoginManager();
                    lm.start(() => { this.retryCredentials(); });
                } else {
                    $(".booking-interaction").off().empty();
                    $(".login-name").off().text(this.currentMember.Fullname);
                    switch (this.currentMember.BookingPermission) {
                        case server.BookingPermissions.Disallowed:
                            var html = str.format("<div class='booking-disallowed'>Booking is currently unavailable:<div class='explanation'>{0}</div></div>", this.currentMember.Explanation);
                            $(".booking-interaction").empty().append($(html));
                            break;
                        case server.BookingPermissions.WithConfirmation:
                        case server.BookingPermissions.WithoutConfirmation:
                        default:
                            $(".booking-interaction").empty();
                            var bd = new bookDates();
                            bd.start(this);
                            break;
                    }
                    //if (this.currentMember.BookingDisallowed) {
                    //    var html = str.format("<div class='booking-disallowed'>Booking is currently unavailable:<div class='explanation'>{0}</div></div>", this.currentMember.Explanation);
                    //    $(".booking-interaction").empty().append($(html));
                    //} else {
                    //    $(".booking-interaction").empty();
                    //    var bd = new bookDates();
                    //    bd.start(this);
                    //}
                }
            }
            private retryCredentials(): void {
                var memberInfoUrl = "bookingapi/member";
                ajax.Get({ url: memberInfoUrl }, false).then((r) => {
                    this.currentMember = r;
                    this.setMember();
                });
            }
        }
        import loginModels = fastnet.booking.login;
        class LoginManager {
            private lastUserKey = "last-successful-user";
            private callback: any;
            public model: loginModels.credentials;
            //private loginInvitation: string =
            //`<div class='login-invitation'>
            //    <div>Online booking is available to members only. If you are a member please <a href='#' data-cmd='login-cmd'>login</a> first.
            //    If you are not a member, please <a href='/register' >register</a>.</div>
            //    <div><button class='btn btn-primary' data-cmd='test-form' >Test Forms</button></div>
            // </div>`;
            private loginInvitation: string =
            `<div class='login-invitation'>
            <div>Online booking is available to members only. If you are a member please <a href='#' data-cmd='login-cmd'>login</a> first.
            If you are not a member, please <a href='/register' >register</a>.</div>
         </div>`;
            public start(cb: any): void {
                this.callback = cb;
                $(".login-name").empty();
                $(".booking-interaction").append($(this.loginInvitation));
                $(".login-invitation a[data-cmd]").on("click", (e) => {
                    //var cmd: string = $(e.target).attr("data-cmd");
                    var cmd: string = $(e.currentTarget).attr("data-cmd");
                    switch (cmd) {
                        case "login-cmd":
                            this.onLoginRequested();
                            break;
                    }
                });
                //var t = new fastnet.tests();
                //t.start();
            }
            private login(f: forms.form, data: loginModels.loginModels): boolean {
                var result = false;
                ajax.Post({ url: "user/login", data: { emailAddress: data.current.email, password: data.current.password } })
                    .then((r: { Success: boolean, Error: string }) => {
                        if (r.Success) {
                            f.close();
                            h$.setLocalData(this.lastUserKey, data.current.email);
                            this.callback();
                        } else {
                            f.find(".login-failure").text(r.Error);
                        }
                    });
                return result;

            }
            private onLoginRequested(): void {
                debug.print("onLoginRequested")
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
                wt.getTemplate({ ctx: this, templateUrl: loginFormTemplateUrl }).then((r) => {
                    var template = r.template;
                    loginForm.setContentHtml(template);
                    loginForm.find(".login-failure").empty();
                    loginForm.open((ctx: LoginManager, f: forms.form, cmd: string, data: loginModels.loginModels) => {
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
            }
        }
        import bookingModels = fastnet.booking;// bookingVM;
        class bookDates {
            private bookingApp: bookingApp;
            private step1_model: bookingModels.request_step1;
            private step1_vm: bookingModels.observableRequest_step1;
            private step2_model: request_step2;
            private step2_vm: observableRequest_step2;
            private step3_model: request_step3;
            private step3_vm: observableRequest_step3;
            private dpOptions: JQueryUI.DatepickerOptions;
            public start(app: bookingApp): void {
                this.bookingApp = app;
                this.subscribeToAppEvents();
                this.dpOptions = {
                    minDate: app.calendarPeriod.start,
                    maxDate: app.calendarPeriod.end,
                    beforeShow: this.beforeShowingDatePicker,
                    beforeShowDay: (d) => { return this.beforeShowDay(d); },
                    onChangeMonthYear: (m, y) => {
                        //debug.print("onChangeMonthYear: month {0} year {1}", m, y);
                        //app.calendarOnChangeMonth(m, y);
                    },
                    // onSelect: this.onSelectDate,
                    dateFormat: 'dMyy'
                };

                this.step1_model = new bookingModels.request_step1();
                this.step1_model.mobileNumber = app.currentMember.MobileNumber;
                this.step1_vm = new bookingModels.observableRequest_step1(this.step1_model, { maximumNumberOfPeople: this.bookingApp.bookingParameters.maximumOccupants });
                this.step1();
            }
            private subscribeToAppEvents() {
                $(this.bookingApp).on("refresh-calendar", (event) => {
                    //debug.print("booking app calendar refresh");
                    $("#startDatePicker").datepicker("refresh");
                });
            }
            private unSubscribeToAppEvents() {
                $(this.bookingApp).off("refresh-calendar");
            }
            private beforeShowDay(d): any[] {
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
            }
            private step1(): void {
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
                wt.getTemplate({ ctx: this, templateUrl: bafTemplateUrl }).then((r) => {
                    baf_step1.setContentHtml(r.template);
                    baf_step1.open((ctx: bookDates, f: forms.form, cmd: string, data: bookingModels.step1Models) => {
                        switch (cmd) {
                            case "cancel-command":
                                //f.close();
                                //this.start(this.bookingApp);
                                this.step1_vm.reset();
                                break;
                            case "ok-command":
                                if (f.isValid()) {
                                    if (this.canGoToStep2(data.current)) {
                                    }
                                }
                                break;
                        }
                    });
                });
            }
            private step2(choices: server.bookingChoice[]): void {
                this.step3_model = null;
                this.step3_vm = null;
                var sd: string = <any>this.step1_vm.startDate();
                var ed: string = <any>this.step1_vm.endDate();
                var np = parseInt( <any>this.step1_vm.numberOfPeople());
                this.step2_model = new request_step2();
                this.step2_model.choices = choices;
                
                this.step2_vm = new observableRequest_step2(this.step2_model, sd, ed, np);
                var buttons: forms.formButton[] = [
                    {
                        text: "Back", 
                        command: "back-command",
                        position: forms.buttonPosition.right
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
                wt.getTemplate({ ctx: this, templateUrl: bafTemplateUrl }).then((r) => {
                    baf_step2.setContentHtml(r.template);
                    baf_step2.open((ctx: bookDates, f: forms.form, cmd: string, data: step2Models) => {
                        switch (cmd) {
                            case "cancel-command":
                                this.step1_vm.reset();
                                this.step1();
                                break;
                            case "back-command":
                                this.step1();
                                break;
                            case "ok-command":
                                var item = parseInt(this.step2_vm.selected());
                                var choice = this.step2_model.choices[item - 1];
                                //debug.print("choice is {0} {1}", choice.choiceNumber, choice.description);
                                this.step3(choice);
                                break;
                        }
                    });
                });
            }
            private step3(choice: server.bookingChoice): void {
                var td = str.toMoment(this.bookingApp.bookingParameters.today);
                var sd: string = <any>this.step1_vm.startDate();
                var ed: string = <any>this.step1_vm.endDate();
                var np = parseInt(<any>this.step1_vm.numberOfPeople());
                var daysToStart = str.toMoment(sd).diff(td, 'd');
                //Todo: implment a way to avoid hard coding the cast to dwhParameters)
                var dwhParameters = <dwhParameters> this.bookingApp.bookingParameters;
                var isShortTerm = daysToStart < dwhParameters.shortBookingInterval;
                this.step3_model = new request_step3(sd, ed, choice,
                    this.bookingApp.bookingParameters.termsAndConditionsUrl, isShortTerm, dwhParameters.shortBookingInterval, this.bookingApp.bookingParameters.paymentGatewayAvailable);
                this.step3_vm = new observableRequest_step3(this.step3_model);
                var buttons: forms.formButton[] = [
                    {
                        text: "Back",
                        command: "back-command",
                        position: forms.buttonPosition.right
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
                wt.getTemplate({ ctx: this, templateUrl: bafTemplateUrl }).then((r) => {
                    baf_step3.setContentHtml(r.template);
                    baf_step3.open((ctx: bookDates, f: forms.form, cmd: string, data: any) => {
                        switch (cmd) {
                            case "cancel-command":
                                this.step1_vm.reset();
                                this.step1();
                                break;
                            case "back-command":
                                if (this.step2_model !== null) {
                                    this.step2(this.step2_model.choices);
                                } else {
                                    this.step1();
                                }
                                break;
                            case "ok-command":
                                if (f.isValid()) {
                                    debug.print("go to confirmation");
                                }
                                break;
                        }
                    });
                });
            }
            private beforeShowingDatePicker(input: any, inst: any): JQueryUI.DatepickerOptions {
                // $("#startDatePicker").datepicker("refresh");
                if (input.id === "startDatePicker") {
                    $("#ui-datepicker-div").addClass("booking-month").removeClass("end-month").addClass("start-month");
                }
                else if (input.id === "endDatePicker") {
                    $("#ui-datepicker-div").addClass("booking-month").removeClass("start-month").addClass("end-month");
                }
                return null;
            }

            private canGoToStep2(model: bookingModels.request_step1): boolean {
                //var url = str.format("bookingapi/get/choices/{0}/{1}/{2}/{3}",
                //    this.bookingApp.bookingParameters.currentAbode.id, moment(model.startDate).format("DDMMMYYYY"), moment(model.endDate).format("DDMMMYYYY"), model.numberOfPeople);
                var url = str.format("bookingapi/get/choices/{0}/{1}/{2}/{3}",
                    this.bookingApp.bookingParameters.currentAbode.id, model.startDate, model.endDate, model.numberOfPeople);
                ajax.Get({ url: url }, false).then((r: server.availabilityInfo) => {
                    if (!r.success) {
                        debug.print(r.explanation);
                        forms.messageBox.show(r.explanation).then(() => {
                            this.step1();
                        });
                    } else {
                        if (r.choices.length === 1) {
                            this.step3(r.choices[0]);
                        } else {
                            this.step2(r.choices);
                        }
                    }
                });
                return false;
            }
        }
    }
}