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
    interface member {
        anonymous: boolean;
        memberId?: string;
        fullname?: string;
    }
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
        public static getFormStyleClasses(): string[]{
            return ["booking-forms"];
        }
    }
    export class bookingApp {
        private dayDictionary: collections.Dictionary<string, DayInformation>;
        private dayDictionaryMonthsLoaded: collections.Dictionary<string, boolean>;
        private currentMember: member;
        private calendarPeriod: period;
        public start(): void {
            this.dayDictionary = new collections.Dictionary<string, DayInformation>();
            this.dayDictionaryMonthsLoaded = new collections.Dictionary<string, boolean>();
            this.currentMember = { anonymous: true, fullname: null };
            this.calendarPeriod = { start: null, end: null };
            //this.loadInitialisationData(() => {
            //    this.setMember();
            //    var initialNumberOfMonths = this.addBookingCalendar();
            //    this.loadDayDictionaryInSteps(this.calendarPeriod.start, initialNumberOfMonths, () => {
            //        //debugger;
            //    });
            //});
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
            var calendarInfoUrl = "bookingapi/calendar/setup/info";
            var memberInfoUrl = "bookingapi/member";
            $.when(
                ajax.Get({ url: memberInfoUrl }, false),
                ajax.Get({ url: calendarInfoUrl }, false)).then((r1, r2) => {
                    this.currentMember = r1[0];
                    this.calendarPeriod.start = moment(r2[0].startAt).toDate();
                    this.calendarPeriod.end = moment(r2[0].until).toDate();
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
        private calendarBeforeShowDate(d): any[] {
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
        private calendarOnChangeMonth(year, month) {
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
            if (this.currentMember.anonymous) {
                var lm = new LoginManager();
                lm.start();
            } else {
                $(".booking-interaction").off().empty();
                $(".login-name").off().text(this.currentMember.fullname);
            }
        }
    }
    class loginModel extends forms.viewModel {
        public email: string;
        public password: string;
        public validateProperty(property: string, original: loginModel): forms.validationResult {
            var result: forms.validationResult;
            switch (property) {
                case "email":
                    debug.print("validation required for email, value {0}", this.email);
                    //result = this.validateEmail();
                    break;
                default:
                    //result = super.validateProperty(property, original);
                    break;
            }
            return result;
        }
        //private validateEmail(): forms.validationResult {
        //    return validator.validateEmailAddress(this.email);
        //}
    }
    class LoginManager {
        public model: loginModel;
        private loginInvitation: string =
        `<div class='login-invitation'>
            <div>Online booking is available to members only. If you are a member please <a href='#' data-cmd='login-cmd'>login</a> first.
            If you are not a member, please <a href='/register' >register</a>.</div>
            <div><button class='btn btn-primary' data-cmd='test-form' >Test Forms</button></div>
         </div>`;
        public start(): void {
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
            var t = new fastnet.tests();
            t.start();
        }
        
        private login(data: forms.models): void {
            debugger;
        }
        private onLoginRequested(): void {
            debug.print("onLoginRequested")
            var loginForm = new forms.form(this, {                
                modal: true,
                title: "Login",
                styleClasses: configuration.getFormStyleClasses(),
                okButtonText: "Login"
            }, null);
            var loginFormTemplateUrl = "booking/login";
            wt.getTemplate({ ctx: this, templateUrl: loginFormTemplateUrl }).then((r) => {
                var template = r.template;
                var lm: LoginManager = r.ctx;
                lm.model = new loginModel();
                lm.model.fromJSObject({ email: "asim", password: "password" });
                loginForm.setContentHtml(template);
                loginForm.open((ctx: LoginManager, f: forms.form, cmd: string, data: forms.models) => {
                    switch (cmd) {
                        case "cancel-command":
                            f.close();
                            break;
                        case "ok-command":
                            ctx.login(data);
                            break;
                    }
                });
                //loginForm.disableCommand("ok-command");
            });
        }
    }
}