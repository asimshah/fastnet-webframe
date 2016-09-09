/// <reference path="../../../scripts/typings/jquery/jquery.d.ts" />
/// <reference path="../../../scripts/typings/jqueryui/jqueryui.d.ts" />
/// <reference path="../../../scripts/typings/moment/moment.d.ts" />
/// <reference path="../../../scripts/typings/knockout/knockout.d.ts" />
////// <reference path="../../../../fastnet.webframe.bookingdata/transferobjects/calendarsetup.cs.d.ts" />
/// <reference path="../../../../fastnet.webframe.bookingdata/classes with typings/calendarsetup.cs.d.ts" />
/// <reference path="../../../scripts/typings/mustache/mustache.d.ts" />


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
        interface completedBooking {
            BookingId: number;
            BookingReference: string;
            MemberEmailAddress: string;
            BookingSecretaryEmailAddress: string;
            OnlinePaymentRequired: boolean;
        }
        class configuration {
            public static getFormStyleClasses(): string[] {
                return ["booking-forms"];
            }
        }
        export class myBooking {
            public today: Date;
            public currentMember: server.MemberInfo;
            public paymentGatewayAvailable: boolean;
            public start(paymentGateway: boolean): void {
                this.paymentGatewayAvailable = paymentGateway;
                $.fn.dataTable.moment('DDMMMYYYY');
                var config: forms.configuration = {
                    modelessContainer: "booking-interaction",
                    additionalValidations: bookingAppValidations.GetValidators()
                };
                this.today = new Date();
                forms.form.initialise(config);
                this.getMemberInfo().then(() => {
                    this.showBookings();
                });
            }
            public showBookings() {
                var templateUrl = "booking/mybookings";
                var dataurl = str.format("bookingapi/get/my/bookings");
                ajax.Get({ url: dataurl }, false).then((result: { member: string, bookings: server.booking[] }) => {
                    var model = new observableMyBookingsModel(result.bookings);
                    wt.getTemplate({ ctx: this, templateUrl: templateUrl }).then((r) => {
                        var f = new forms.form(this, {
                            modal: false,
                            title: str.format("Booking(s) for {0}", result.member),
                            //okButton: null,
                            cancelButton: null,
                            okButtonText: "New Booking",
                            additionalButtons: [
                                { text: "Home page", command: "back-to-site", position: forms.buttonPosition.left, isDefault: false }
                            ]
                        }, model);
                        var html = Mustache.render(r.template, result);
                        f.setContentHtml(html);
                        f.open((ctx: any, f: forms.form, cmd: string) => {
                            switch (cmd) {
                                case "ok-command":
                                    f.close();
                                    location.href = "/booking";
                                    break;
                                case "back-to-site":
                                    f.close();
                                    location.href = "/home";
                                    break;
                            }
                        }).then(() => {
                            if (this.paymentGatewayAvailable === false) {
                                f.find(".my-bookings").addClass("payment-gateway-disabled");
                            }
                            f.find("#my-bookings button[data-table-cmd]").on("click", (e) => {
                                this.embeddedButtonHandler(result.bookings, e);
                            });
                            f.find("#my-bookings").DataTable({
                                paging: false,
                                searching: false,
                                info: false,
                                ordering: false,
                                //pagingType: "simple",
                                order: [[0, 'asc']]
                            });
                            $("#my-bookings").css("width", "100%");
                            $(window).on("resize", (e) => {
                                $("#my-bookings").css("width", "100%");
                            });
                        });
                    });
                });
            }
            public getAddressDetails(bookingId: number) {
                var address: addressModel = new addressModel(this.currentMember.FirstName, this.currentMember.LastName);
                var address_vm = new observableAddressModel(address);
                var addressForm = new forms.form(this, {
                    modal: false,
                    title: "Name & Address (for payment verification)",
                    cancelButtonText: "Cancel",
                    okButtonText: "Pay (via Sage)"
                }, address_vm);
                var addressTemplateUrl = "booking/addressDetails";
                wt.getTemplate({ ctx: this, templateUrl: addressTemplateUrl }).then((r) => {
                    addressForm.setContentHtml(r.template);
                    addressForm.open((ctx: myBooking, f: forms.form, cmd: string, data: addressModels) => {
                        switch (cmd) {
                            case "cancel-command":
                                f.close();
                                this.showBookings();
                                break;
                            case "ok-command":
                                if (f.isValid()) {
                                    this.startPayment(data.current, bookingId).then((b: boolean) => {
                                        if (!b) {
                                            f.close();
                                            this.showBookings();
                                        }
                                    });
                                }
                                break;
                        }
                    });
                });
            }
            private startPayment(m: addressModel, bookingId: number): JQueryPromise<boolean> {
                var deferred = $.Deferred<boolean>();
                ajax.Post({
                    url: "bookingapi/pay", data: {
                        source: "mybooking",
                        bookingId: bookingId,
                        address: m
                    }
                }).then((r: { Success: boolean, Error: string }) => {
                    if (r.Success == false) {
                        var message = `Access to Sage has failed.
${r.Error}
This is a system error`;
                        forms.messageBox.show(message).then(() => {
                            deferred.resolve(false);
                        });
                    }
                    else {
                        deferred.resolve(true);
                    }
                });
                return deferred.promise();
            }
            private embeddedButtonHandler(list: server.booking[], e: JQueryEventObject): void {
                e.stopPropagation();
                var ct = e.target;
                var cmd = $(ct).attr("data-table-cmd");
                var id = parseInt($(ct).closest("tr").attr("data-id"));
                switch (cmd) {
                    case "make-payment":
                        debug.print("make payment for booking {0}", id);
                        this.getAddressDetails(id);
                        break;
                }
            }
            private getMemberInfo(): JQueryPromise<void> {
                var deferred = $.Deferred<void>();
                var memberInfoUrl = "bookingapi/member";
                ajax.Get({ url: memberInfoUrl }, false).then((r: server.MemberInfo) => {
                    this.currentMember = r;
                    deferred.resolve();
                });
                return deferred.promise();
            }
        }
        export class bookingApp {
            private dayDictionary: collections.Dictionary<string, server.dayInformation>;
            private dayDictionaryMonthsLoaded: collections.Dictionary<string, boolean>;
            public today: Date;
            public currentMember: server.MemberInfo;
            public calendarPeriod: period;
            public bookingParameters: parameters;// server.bookingParameters;
            public start(): void {
                var config: forms.configuration = {
                    modelessContainer: "booking-interaction",
                    additionalValidations: bookingAppValidations.GetValidators()
                };
                this.today = new Date();
                forms.form.initialise(config);
                this.dayDictionary = new collections.Dictionary<string, server.dayInformation>();
                this.dayDictionaryMonthsLoaded = new collections.Dictionary<string, boolean>();
                this.currentMember = {
                    Anonymous: true,
                    Fullname: null,
                    FirstName: null,
                    LastName: null,
                    MemberId: null,
                    OnBehalfOfMemberId: null,
                    BookingPermission: server.BookingPermissions.Disallowed,
                    Explanation: "Not logged in",
                    MobileNumber: ""
                };
                this.calendarPeriod = { start: null, end: null };
                this.loadInitialisationData().then(() => {
                    this.setMember();
                    var initialNumberOfMonths = this.getCalendarMonthCount();
                    this.addBookingCalendar(initialNumberOfMonths);
                });
            }
            public reloadCalendar(): JQueryPromise<void> {
                var deferred = $.Deferred<void>();
                var dayStatusUrl = str.format("bookingapi/calendar/{0}/status", this.bookingParameters.currentAbode.id);
                ajax.Get({ url: dayStatusUrl }, false).then((r) => {
                    var dayInformation: server.dayInformation[] = r;
                    this.loadDayInformation(dayInformation);
                    this.refreshBookingCalendar();
                    deferred.resolve();
                });
                return deferred.promise();
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
                                //default:
                                //    r = [true, "free", "default pop-up"];
                                break;
                        }
                        return r;

                    }
                    else {
                        //debug.print("day dictionary does not contain key {0}", day.format("DDMMMYYYY"));
                        return [true, "free", "This day is free"];
                        //return [false, "blocked", "not ready"];
                    }
                }
            }
            private loadInitialisationData(): JQueryPromise<void> {
                var deferred = $.Deferred<void>();
                var parametersUrl = "bookingapi/parameters";
                ajax.Get({ url: parametersUrl }, false).then((p: server.bookingParameters) => {
                    factory.setFactory(p.factoryName);
                    this.bookingParameters = factory.getParameters(p);// p;
                    //this.bookingParameters.setFromJSON(p);
                    var abodeId = this.bookingParameters.currentAbode.id;
                    var calendarInfoUrl = str.format("bookingapi/calendar/{0}/setup/info", abodeId);
                    var memberInfoUrl = "bookingapi/member";
                    var dayStatusUrl = str.format("bookingapi/calendar/{0}/status", this.bookingParameters.currentAbode.id);
                    $.when(
                        ajax.Get({ url: memberInfoUrl }, false),
                        ajax.Get({ url: calendarInfoUrl }, false),
                        ajax.Get({ url: dayStatusUrl }, false)
                    ).then((r1, r2, r3) => {
                        this.currentMember = <server.MemberInfo>r1[0];
                        var csi: server.calendarSetup = r2[0];
                        this.today = moment(csi.Today).toDate();
                        this.calendarPeriod.start = moment(csi.StartAt).toDate();// moment(r2[0].startAt).toDate();
                        this.calendarPeriod.end = moment(csi.Until).toDate();// moment(r2[0].until).toDate();
                        var dayInformation: server.dayInformation[] = r3[0];
                        this.loadDayInformation(dayInformation);
                        deferred.resolve();
                    });
                });
                return deferred.promise();
            }
            private loadDayInformation(diList: server.dayInformation[]) {
                diList.forEach((value, index, array) => {
                    this.dayDictionary.setValue(value.day, value);
                });
            }
            private refreshBookingCalendar() {
                $('#bookingCalendar').datepicker("refresh");
                $(this).trigger("refresh-calendar");
            }
            private getCalendarMonthCount(): number {
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
            }
            private setCalendarMonthCount(): number {
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
                        //case server.BookingPermissions.WithConfirmation:
                        //case server.BookingPermissions.WithoutConfirmation:
                        default:
                            this.startBooking();
                            break;
                    }
                }
            }
            private startBooking() {
                $(".booking-interaction").empty();
                var bd = new bookDates();
                bd.start(this).then((cb: completedBooking) => {
                    this.onBookingCompleted(cb);
                });
            }
            private onBookingCompleted(cb: completedBooking): void {
                debug.print("Booking {0} made", cb.BookingReference);
                // show confirmation template here
                if (cb.OnlinePaymentRequired == false) {
                    this.showStandardConfirmation(cb);
                } else {
                    // we must collect additional info and move to online payment
                    // 1. gather an address for card verification
                    // 2. call sagepay through server-side integration
                    this.getAddressDetails(cb).then(() => {
                    });
                }
                //var bookingConfirmationTemplateUrl = "booking/bookingConfirmation";
                //wt.getTemplate({ ctx: this, templateUrl: bookingConfirmationTemplateUrl }).then((r) => {
                //    var template = r.template;
                //    $("#bookingCalendar").empty();
                //    $(".booking-interaction").empty();
                //    var html = $(Mustache.render(template, cb));
                //    $(".booking-interaction").append(html);
                //});
            }
            private getAddressDetails(cb: completedBooking): JQueryPromise<void> {
                var deferred = $.Deferred<void>();
                var address: addressModel = new addressModel(this.currentMember.FirstName, this.currentMember.LastName);
                var address_vm = new observableAddressModel(address);
                var addressForm = new forms.form(this, {
                    modal: false,
                    title: "Name & Address (for payment verification)",
                    cancelButtonText: "Cancel",
                    okButtonText: "Pay (via Sage)"
                }, address_vm);
                var addressTemplateUrl = "booking/addressDetails";
                wt.getTemplate({ ctx: this, templateUrl: addressTemplateUrl }).then((r) => {
                    addressForm.setContentHtml(r.template);
                    addressForm.open((ctx: myBooking, f: forms.form, cmd: string, data: addressModels) => {
                        switch (cmd) {
                            case "cancel-command":
                                // cancelling at this stage means that the existing booking must be cancelled
                                f.close();
                                this.cancelBooking(cb.BookingId).then(() => {
                                    this.start();
                                });
                                break;
                            case "ok-command":
                                if (f.isValid()) {
                                    this.startPayment(data.current, cb.BookingId).then((b: boolean) => {
                                        f.close();
                                        if (b) {
                                            this.showStandardConfirmation(cb);
                                        } else {
                                            // a failed payment means that the existing booking must be cancelled
                                            this.cancelBooking(cb.BookingId).then(() => {
                                                this.start();
                                            });
                                        }
                                    });
                                }
                                break;
                        }
                    });
                });
                return deferred.promise();
            }
            private cancelBooking(bookingId: number): JQueryPromise<void> {
                var deferred = $.Deferred<void>();
                ajax.Post({
                    url: "bookingapi/cancel", data: {
                        bookingId: bookingId,
                    }
                }).then(() => {
                    deferred.resolve();
                });
                return deferred.promise();
            }
            private startPayment(m: addressModel, bookingId: number): JQueryPromise<boolean> {
                var deferred = $.Deferred<boolean>();
                ajax.Post({
                    url: "bookingapi/pay", data: {
                        source: "onlinebooking",
                        bookingId: bookingId,
                        address: m
                    }
                }).then((r: { Success: boolean, Error: string }) => {
                    if (r.Success == false) {
                        var message = `Access to Sage has failed.
${r.Error}
This is a system error`;
                        forms.messageBox.show(message).then(() => {
                            deferred.resolve(false);
                        });
                    }
                    else {
                        deferred.resolve(true);
                    }
                });
                return deferred.promise();
            }
            private showStandardConfirmation(cb: completedBooking) {
                var bookingConfirmationTemplateUrl = "booking/bookingConfirmation";
                wt.getTemplate({ ctx: this, templateUrl: bookingConfirmationTemplateUrl }).then((r) => {
                    var template = r.template;
                    $("#bookingCalendar").empty();
                    $(".booking-interaction").empty();
                    var html = $(Mustache.render(template, cb));
                    $(".booking-interaction").append(html);
                });
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
            //</div>`;
            private loginInvitation: string =
            `<div class='login-invitation'>
                <div>Online booking is available to members only. If you are a member please <a href='../login'>login</a> first.
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
            private makeBooking: JQueryDeferred<completedBooking>;
            private step1_model: bookingModels.request_step1;
            private step1_vm: bookingModels.observableRequest_step1;
            private step2_model: request_step2;
            private step2_vm: observableRequest_step2;
            private step3_model: request_step3;
            private step3_vm: observableRequest_step3;
            private dpOptions: JQueryUI.DatepickerOptions;
            public start(app: bookingApp): JQueryPromise<completedBooking> {
                this.bookingApp = app;
                this.makeBooking = $.Deferred<completedBooking>();
                this.subscribeToAppEvents();
                this.dpOptions = {
                    minDate: app.calendarPeriod.start,
                    maxDate: app.calendarPeriod.end,
                    beforeShow: this.beforeShowingDatePicker,
                    beforeShowDay: (d) => { return this.beforeShowDay(d); },
                    dateFormat: 'dMyy'
                };
                //var shortTermBookingAllowed = this.bookingApp.bookingParameters.paymentGatewayAvailable
                //    || this.bookingApp.currentMember.BookingPermission === server.BookingPermissions.ShortTermBookingAllowed
                //    || this.bookingApp.currentMember.BookingPermission === server.BookingPermissions.ShortTermBookingWithoutPaymentAllowed;
                let shortTermBookingAllowed = true;
                var shortBookingInterval = this.getShortTermBookingInterval();
                var today = str.toMoment(this.bookingApp.bookingParameters.today);
                this.step1_model = new bookingModels.request_step1(today, shortTermBookingAllowed, shortBookingInterval);
                this.step1_model.mobileNumber = app.currentMember.MobileNumber;
                this.step1_vm = new bookingModels.observableRequest_step1(this.step1_model, { maximumNumberOfPeople: this.bookingApp.bookingParameters.maximumOccupants });
                this.step1();
                return this.makeBooking.promise();
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
                var sd: string = str.toDateString(this.step1_vm.startDate());
                var ed: string = str.toDateString(this.step1_vm.endDate());
                var np = parseInt(<any>this.step1_vm.numberOfPeople());
                var under18Present = this.step1_vm.under18Present();
                this.step2_model = new request_step2();
                this.step2_model.choices = choices;

                this.step2_vm = new observableRequest_step2(this.step2_model, sd, ed, np, under18Present);
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
                var sd: string = str.toDateString(this.step1_vm.startDate());
                var ed: string = str.toDateString(this.step1_vm.endDate());
                //var sd: string = <any>this.step1_vm.startDate();
                //var ed: string = <any>this.step1_vm.endDate();
                var np = parseInt(<any>this.step1_vm.numberOfPeople());
                var under18Present = this.step1_vm.under18Present();
                var phoneNumber = this.step1_vm.mobileNumber();
                var daysToStart = str.toMoment(sd).diff(td, 'd');
                var shortBookingInterval = this.getShortTermBookingInterval();
                var isShortTerm = daysToStart < shortBookingInterval;
                this.step3_model = new request_step3(sd, ed, choice,
                    this.bookingApp.bookingParameters.termsAndConditionsUrl, isShortTerm, shortBookingInterval, under18Present,
                    phoneNumber, this.bookingApp.bookingParameters.paymentGatewayAvailable, np);
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
                    baf_step3.open((ctx: bookDates, f: forms.form, cmd: string, data: step3Models) => {
                        switch (cmd) {
                            case "show-tc":
                                this.showTC();
                                break;
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
                                    f.disableCommand("ok-command");
                                    this.saveBookingChoice(f, data.current, this.step3_vm.showPaymentRequiredMessage);
                                }
                                break;
                        }
                    });
                });
            }
            private saveBookingChoice(f: forms.form, model: request_step3, onlinePayment: boolean): void {
                var htmlAvailabilityLost = `<div>This booking could not be made.</div>
                                  <div>The most probable reason is that another booking has just been made that overlaps with these dates.</div>
                                <div>Availability calendar(s) have been updated. It is possible that the booking may succeed on a retry.</div>`;
                var htmlFailed = `<div>This booking could not be made.</div>
                                  <div>An internal error has occurred.</div>`;
                var request: server.bookingRequest = {
                    choice: model.choice,
                    fromDate: str.toDateString(model.fromDate),
                    toDate: str.toDateString(model.toDate),
                    under18spresent: model.under18Present,
                    isPaid: false,
                    phoneNumber: model.phoneNumber,
                    partySize: model.numberOfPeople
                };
                
                var abodeId = this.bookingApp.bookingParameters.currentAbode.id;
                var createBookingUrl = str.format("bookingapi/create/{0}", abodeId);
                ajax.Post({ url: createBookingUrl, data: request }).then((r) => {
                    if (!r.Success && r.Code === "SystemError") {
                        var cf = new forms.form(this, {
                            modal: true,
                            title: "Booking Failed",
                            styleClasses: configuration.getFormStyleClasses(),
                            datepickerOptions: this.dpOptions,
                            cancelButton: null
                        }, null);
                        cf.setContentHtml(htmlFailed);
                        cf.open((ctx: bookDates, f: forms.form, cmd: string, data: any) => {
                            f.close();
                            this.step1_vm.reset();
                            this.step1();
                        });
                    }
                    else {
                        this.bookingApp.reloadCalendar().then(() => {
                            if (r.Success) {
                                var cb: completedBooking = {
                                    BookingId: r.BookingId,
                                    BookingReference: r.BookingReference,
                                    MemberEmailAddress: r.MemberEmailAddress,
                                    BookingSecretaryEmailAddress: r.BookingSecretaryEmailAddress,
                                    OnlinePaymentRequired: onlinePayment
                                };
                                this.makeBooking.resolve(cb);
                            } else {
                                switch (r.Code) {
                                    case "AvailabilityLost":
                                        var cf = new forms.form(this, {
                                            modal: true,
                                            title: "Booking Failed",
                                            styleClasses: configuration.getFormStyleClasses(),
                                            datepickerOptions: this.dpOptions,
                                            cancelButton: null
                                        }, null);
                                        cf.setContentHtml(htmlAvailabilityLost);
                                        cf.open((ctx: bookDates, f: forms.form, cmd: string, data: any) => {
                                            f.close();
                                            //this.step1_vm.reset();
                                            this.step1();
                                        });
                                        break;
                                }
                            }
                        });
                    }
                });
            }
            private getShortTermBookingInterval(): number {
                //ToDo: implement a way to avoid hard coding the cast to dwhParameters)
                var dwhParameters = <dwhParameters>this.bookingApp.bookingParameters;
                return dwhParameters.paymentInterval
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
            private canGoToStep2(model: bookingModels.request_step1): boolean {
                var sd = str.toDateString(model.startDate);
                var ed = str.toDateString(model.endDate);
                var url = str.format("bookingapi/get/choices/{0}/{1}/{2}/{3}",
                    this.bookingApp.bookingParameters.currentAbode.id, sd, ed, model.numberOfPeople);
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
            private showTC(): void {
                var url = str.format("pageapi/{0}", this.bookingApp.bookingParameters.termsAndConditionsUrl);
                ajax.Get({ url: url }, true).then((r) => {
                    var tcf = new forms.form(this, {
                        modal: true,
                        initialWidth: 600,
                        initialHeight: 300,
                        title: "Terms and Conditions",
                        styleClasses: configuration.getFormStyleClasses(),
                        datepickerOptions: this.dpOptions,
                        cancelButton: null,
                        okButtonText: "Close",
                    }, null);
                    tcf.setContentHtml(r.HtmlText);
                    tcf.open((ctx: bookDates, f: forms.form, cmd: string, data: any) => {
                        f.close();
                    });
                });
            }
        }
    }
}