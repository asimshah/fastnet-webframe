/// <reference path="../../../scripts/typings/jquery/jquery.d.ts" />
/// <reference path="../../../scripts/typings/jqueryui/jqueryui.d.ts" />
/// <reference path="../../../scripts/typings/moment/moment.d.ts" />
/// <reference path="../../../scripts/typings/knockout/knockout.d.ts" />
/// <reference path="../../../scripts/collections/collections.d.ts" />


module fastnet {
    //var __u = fastnet.utilities.getInstance();// new utilities();
    import ajax = fastnet.util.ajax;
    import debug = fastnet.util.debug;
    import str = fastnet.util.str;
    import wt = fastnet.web.tools;
    import forms = fastnet.forms;
    import h$ = fastnet.util.helper;
    //import validator = forms.validator;
    enum DayStatus {
        IsClosed,
        IsFree,
        IsFull,
        IsPartBooked,
        IsNotBookable
    }
    interface DayInformation {
        Day: Date;
        Status: DayStatus,
        StatusDisplay: string
    }
    interface monthTuple {
        year: number;
        month: number;
    }
    //interface member {
    //    Anonymous: boolean;
    //    MemberId?: string;
    //    Fullname?: string;
    //}
    interface period {
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
    export class bookingApp {
        private dayDictionary: collections.Dictionary<string, DayInformation>;
        private dayDictionaryMonthsLoaded: collections.Dictionary<string, boolean>;
        private currentMember: server.MemberInfo;
        public calendarPeriod: period;
        public parameters: server.Parameters;
        public start(): void {
            var config: forms.configuration = {
                modelessContainer: "booking-interaction",
                additionalValidations: bookingAppValidations.GetValidators()
            };
            forms.form.initialise(config);
            this.dayDictionary = new collections.Dictionary<string, DayInformation>();
            this.dayDictionaryMonthsLoaded = new collections.Dictionary<string, boolean>();
            this.currentMember = { Anonymous: true, Fullname: null, MemberId: null, BookingDisallowed: true, Explanation: "Not logged in" };
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
            // we need to load:
            // 1. the current member,
            // 2. the forward bookable period (for the booking calendar)
            var deferred = $.Deferred<void>();
            var parametersUrl = "bookingapi/parameters";
            var calendarInfoUrl = "bookingapi/calendar/setup/info";
            var memberInfoUrl = "bookingapi/member";
            $.when(
                ajax.Get({ url: memberInfoUrl }, false),
                ajax.Get({ url: calendarInfoUrl }, false),
                ajax.Get({ url: parametersUrl }, false)
                ).then((r1, r2, r3) => {
                    this.currentMember = <server.MemberInfo>r1[0];
                    var csi: bookingData.calendarSetup = r2[0];
                    this.calendarPeriod.start = moment(csi.StartAt).toDate();// moment(r2[0].startAt).toDate();
                    this.calendarPeriod.end = moment(csi.Until).toDate();// moment(r2[0].until).toDate();
                    this.parameters = <server.Parameters>r3[0];
                    deferred.resolve();
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
                    $('#bookingCalendar').datepicker('refresh');
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
                if (next == null || numberOfMonthsToLoad < 1) {
                    afterLoad();
                }
                else {
                    app.loadDayDictionaryForMonth(app, next, numberOfMonthsToLoad - 1, getNextMonth, afterLoad);
                }
            }
            var dayStatusForMonthUrl = str.format("bookingapi/calendar/status/month/{0}/{1}", month.year, month.month);
            var monthKey = str.format("{0}-{1}", month.year, month.month);
            var alreadyDone = app.dayDictionaryMonthsLoaded.containsKey(monthKey) && app.dayDictionaryMonthsLoaded.getValue(monthKey);
            if (!alreadyDone) {
                $.when(ajax.Get({ url: dayStatusForMonthUrl }, false)).then((r) => {
                    var ds: DayInformation[] = r;
                    ds.forEach((value, index, array) => {
                        app.dayDictionary.setValue(moment(value.Day).format("DDMMMYYYY"), value);
                    });
                    app.dayDictionaryMonthsLoaded.setValue(monthKey, true);
                    //debug.print("loaded: year {0}, month: {1}", month.year, month.month);
                    app.refreshBookingCalendar();
                    doNext();
                });
            } else {
                doNext();
            }
        }
        private refreshBookingCalendar() {
            $('#bookingCalendar').datepicker("refresh");
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
            var day: moment.Moment = moment(d);
            if (day.isBefore(this.calendarPeriod.start) || day.isAfter(this.calendarPeriod.end)) {
                return [false, "blocked", "Out of range"];
            }
            if (this.dayDictionary.isEmpty()) {
                return [false, "blocked", "not ready"];
            } else {
                if (this.dayDictionary.containsKey(day.format("DDMMMYYYY"))) {
                    var di = this.dayDictionary.getValue(day.format("DDMMMYYYY"));
                    var r: any[];
                    switch (di.Status) {
                        case DayStatus.IsClosed:
                            r = [false, "out-of-service", di.StatusDisplay];
                            break;
                        case DayStatus.IsFull:
                            r = [false, "fully-booked", di.StatusDisplay];
                            break;
                        case DayStatus.IsNotBookable:
                            r = [false, "not-bookable", di.StatusDisplay];
                            break;
                        case DayStatus.IsPartBooked:
                            r = [true, "part-booked", di.StatusDisplay];
                            break;
                        case DayStatus.IsFree:
                            r = [true, "free", di.StatusDisplay];
                            break;
                    }
                    return r;

                }
                else {
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
                    this.calendarOnChangeMonth(m, y);
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
                if (this.currentMember.BookingDisallowed) {
                    var html = str.format("<div class='booking-disallowed'>Booking is currently unavailable:<div class='explanation'>{0}</div></div>", this.currentMember.Explanation);
                    $(".booking-interaction").empty().append($(html));
                } else {
                    $(".booking-interaction").empty();
                    var bd = new bookDates();
                    bd.start(this);
                }
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
    import loginModels = bookingVM.login;
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
                var cmd: string = $(e.target).attr("data-cmd");
                switch (cmd) {
                    case "login-cmd":
                        this.onLoginRequested();
                        break;
                }
            });
            //var t = new fastnet.tests();
            //t.start();
        }
        private login(f: forms.form, data: loginModels.formData): boolean {
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
                loginForm.open((ctx: LoginManager, f: forms.form, cmd: string, data: loginModels.formData) => {
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
    import bookingModels = bookingVM;
    class bookDates {
        private bookingApp: bookingApp;
        private model: bookingModels.request;
        private vm: bookingModels.observableRequest;
        private dpOptions: JQueryUI.DatepickerOptions;
        public start(app: bookingApp): void {
            this.bookingApp = app;
            this.dpOptions = {
                minDate: app.calendarPeriod.start,
                maxDate: app.calendarPeriod.end,
                beforeShow: this.beforeShowingDatePicker,
                beforeShowDay: (d) => { return this.beforeShowDay(d); },
                onChangeMonthYear: (m, y) => {
                    app.calendarOnChangeMonth(m, y);
                },
                dateFormat: 'dMyy'
            };
            this.model = new bookingModels.request();
            this.vm = new bookingModels.observableRequest(this.model, { maximumNumberOfPeople: this.bookingApp.parameters.MaximumOccupants });
            this.step1();
        }

        private beforeShowDay(d): any[]{
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
            var baf = new forms.form(this, {
                modal: false,
                title: "Book Accomodation - Step 1",
                styleClasses: configuration.getFormStyleClasses(),
                datepickerOptions: this.dpOptions,
                okButtonText: "Next",
                cancelButtonText: "Clear"
            }, this.vm);
            var bafTemplateUrl = "booking/request-step1";
            wt.getTemplate({ ctx: this, templateUrl: bafTemplateUrl }).then((r) => {
                baf.setContentHtml(r.template);
                baf.open((ctx: bookDates, f: forms.form, cmd: string, data: bookingModels.requestFormData) => {
                    switch (cmd) {
                        case "cancel-command":
                            f.close();
                            this.start(this.bookingApp);
                            break;
                        case "ok-command":
                            if (f.isValid()) {
                                if (this.canGoToStep2(data.current)) {
                                } else {
                                }
                            }
                            break;
                    }
                });
            });
        }
        private beforeShowingDatePicker(input: any, inst: any): JQueryUI.DatepickerOptions {
            if (input.id === "startDatePicker") {
                $("#ui-datepicker-div").addClass("booking-month").removeClass("end-month").addClass("start-month");
            }
            else if (input.id === "endDatePicker") {
                $("#ui-datepicker-div").addClass("booking-month").removeClass("start-month").addClass("end-month");
            }
            return null;
        }
        private canGoToStep2(model: bookingModels.request): boolean {
            var url = str.format("bookingapi/checkavailability/{0}/{1}/{2}", moment(model.startDate).format("DDMMMYYYY"), moment(model.endDate).format("DDMMMYYYY"), model.numberOfPeople);
            ajax.Get({ url: url }, false).then((r: server.AvailabilityInfo) => {
                if (!r.Success) {
                    debug.print(r.Explanation);
                    forms.messageBox.show(r.Explanation).then(() => {
                        this.step1();
                    });
                }
            });
            return false;
        }
    }
}