/// <reference path="../../../scripts/typings/jquery/jquery.d.ts" />
/// <reference path="../../../scripts/typings/jqueryui/jqueryui.d.ts" />
/// <reference path="../../../scripts/typings/moment/moment.d.ts" />
/// <reference path="typings/collections.d.ts" />



module fastnet {
    //var __u = fastnet.utilities.getInstance();// new utilities();
    import ajax = fastnet.util.ajax;
    import debug = fastnet.util.debug;
    import str = fastnet.util.str;
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
    export class bookingApp {
        private dayDictionary: collections.Dictionary<string, DayInformation>;
        private help: number;
        private currentMember: member;
        private calendarPeriod: period;
        public start(): void {
            this.dayDictionary = new collections.Dictionary<string, DayInformation>();
            this.currentMember = { anonymous: true, fullname: null };
            this.calendarPeriod = { start: null, end: null };
            this.loadInitialisationData(() => {
                this.setMember();
                this.addBookingCalendar();
                this.loadDayDictionaryInSteps(() => {
                    //debugger;
                });
            });
        }
        //public addDayInformation(key: string, di: DayInformation) {
        //    this.dayDictionary.setValue(key, di);
        //}
        private loadInitialisationData(afterLoad: callback): void {
            // we need to load:
            // 1. the current member,
            // 2. the forward bookable period (for the booking calendar)
            var calendarInfoUrl = "bookingapi/calendar/setup/info";
            var memberInfoUrl = "bookingapi/member";
            $.when(
                ajax.Get({ url: memberInfoUrl }, false),
                ajax.Get({ url: calendarInfoUrl }, false)).then((r1, r2) => {
                    this.currentMember = r1[0];
                    this.calendarPeriod.start = moment(r2[0].startAt).toDate();
                    this.calendarPeriod.end = moment(r2[0].until).toDate();
                    afterLoad();
                });
        }
        //private abcStart: number;
        //private abcStop: number;
        private loadDayDictionaryInSteps(afterLoad: callback) {
            var lastMonth = false;
            var sd = moment(this.calendarPeriod.start);
            var ed = moment(this.calendarPeriod.end);
            var year = sd.year();
            var month = sd.month() + 1;
            var lyear = ed.year();
            var lmonth = ed.month() + 1;
            this.loadDayDictionaryForMonth(this, { year: year, month: month }, (mt: monthTuple) => {
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
            //var stepLoad = () => {
            //    this.loadDayDictionaryForMonth(,xx,  () => {
            //        if (!lastMonth) {
            //            debug.print("loaded: year {0}, month: {1}", year, month);
            //            sd = sd.add(1, 'M');
            //            year = sd.year();
            //            month = sd.month();
            //            lastMonth = year === lyear && month === lmonth;
            //            var xx = () => stepLoad();
            //            xx();
            //        }
            //    });
            //};
            //stepLoad();
        }
        private loadDayDictionaryForMonth(app: bookingApp, month: monthTuple, getNextMonth: getMonthTupleCallback,  afterLoad: callback) {
            var dayStatusForMonthUrl = str.format("bookingapi/calendar/status/month/{0}/{1}", month.year, month.month);

            $.when(ajax.Get({ url: dayStatusForMonthUrl }, false)).then((r) => {
                var ds: DayInformation[] = r;
                //this.abcStop = Date.now();
                //debug.print("day dictionary loaded in {0} ms, {1} entries", this.abcStop - this.abcStart, ds.length);
                ds.forEach((value, index, array) => {
                    //app.addDayInformation(moment(value.Day).format("DDMMMYYYY"), value);
                    app.dayDictionary.setValue(moment(value.Day).format("DDMMMYYYY"), value);
                });
                debug.print("loaded: year {0}, month: {1}", month.year, month.month);
                var next = getNextMonth(month);
                if (next == null) {
                    afterLoad();
                }
                else {
                    app.loadDayDictionaryForMonth(app, next, getNextMonth, afterLoad);
                }
            });
        }
        //private loadDayDictionary(afterLoad: callback): void {
        //    this.abcStart = Date.now();
            
        //    var dayStatusUrl = str.format("bookingapi/calendar/status/from/{0}/to/{1}",
        //        moment(this.calendarPeriod.start).format("YYYY-MM-DD"), moment(this.calendarPeriod.end).format("YYYY-MM-DD"));
        //    $.when(ajax.Get({ url: dayStatusUrl }, false)).then((r) => {
        //        var ds: DayInformation[] = r;
        //        this.abcStop = Date.now();
        //        debug.print("day dictionary loaded in {0} ms, {1} entries", this.abcStop - this.abcStart, ds.length);
        //        ds.forEach((value, index, array) => {
        //            this.dayDictionary.setValue(moment(value.Day).format("DDMMMYYYY"), value);
        //        });

        //        afterLoad();
        //    });
        //}
        private setCalendarMonthCount() {
            var fw = $(window).width();
            var w = fw - 450;
            var factor = 220;
            var n = 4;
            if (w <= (factor * 2)) {
                n = Math.round((w + (factor / 2)) / factor) + 1;
            }
            //n = 1;
            debug.print("fw: {0}, w: {1}, n: {2}", fw, w, n);
            var cn = $('#bookingCalendar').datepicker("option", "numberOfMonths");
            if (n != cn) {
                $('#bookingCalendar').datepicker("option", "numberOfMonths", n);
            }
        }
        private calendarBeforeShowDate(d): any[] {
            var day: moment.Moment = moment(d);
            if (day.isBefore(this.calendarPeriod.start) || day.isAfter(this.calendarPeriod.end)) {
                return [false, "blocked", "Out of range"];
            }
            if (this.dayDictionary.isEmpty()) {
                return [false, "blocked", "not ready"];
            } else {
                //debug.print("calendarBeforeShowDate(): {0}", day.format("DDMMMYYYY"));
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
                    }
                    return r;
                    
                }
                else {
                    return [true, "free", "This day is free"];
                }
            }
        }
        private calendarOnChangeMonth(year, month) {
            debug.print("calendarOnChangeMonth(): year {0}, month {1}", year, month);
        }

        private addBookingCalendar(): void {
            $('#bookingCalendar').datepicker({
                numberOfMonths: 4,
                minDate: this.calendarPeriod.start,
                maxDate: this.calendarPeriod.end,
                beforeShowDay: (d) => { return this.calendarBeforeShowDate(d); },// this.calendarBeforeShowDate ,
                onChangeMonthYear: this.calendarOnChangeMonth,
                    
                //onSelect: this.BookingDateSelected,
                dateFormat: 'DD d M yy'
            }).val('');
            window.onresize = (e) => {
                this.setCalendarMonthCount();
            };
            this.setCalendarMonthCount();
        }
        private setMember(): void {
            if (this.currentMember.anonymous) {
                debug.print("user is anonymous");
                $(".login-name").text('anon');
            } else {
                debug.print("user is {0}", this.currentMember.fullname);
                $(".login-name").text(this.currentMember.fullname);
            }
        }
    }
}