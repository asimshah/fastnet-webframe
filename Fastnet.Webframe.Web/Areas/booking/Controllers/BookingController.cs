﻿using Fastnet.Common;
using Fastnet.EventSystem;
using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.WebApi;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using System.Transactions;
using System.Web.Http;

namespace Fastnet.Webframe.Web.Areas.booking.Controllers
{
    [RoutePrefix("bookingapi")]
    public class BookingController : BaseApiController
    {
        private CoreDataContext DataContext = Core.GetDataContext();
        [HttpGet]
        [Route("banner")]
        public dynamic GetBannerHtml()
        {
            PageContent bannerContent = Member.Anonymous.FindLandingPage()[PageType.Banner];
            if (bannerContent != null)
            {
                return new { Success = true, Styles = bannerContent.HtmlStyles, Html = bannerContent.HtmlText };
            }
            else
            {
                return new { Success = false };
            }
        }
        [HttpGet]
        [Route("member")]
        public MemberInfo GetMember()
        {
            MemberBase m = this.GetCurrentMember();
            if (m.IsAnonymous)
            {
                return new MemberInfo { Anonymous = true };
            }
            else
            {
                var mi = Factory.GetMemberInfo();
                mi.CopyBookingData(m);
                //mi.Anonymous = false;
                //mi.MemberId = m.Id;
                //mi.Fullname = m.Fullname;
                //mi.MobileNumber = m.p
                if (!Globals.BookingIsOpen())
                {
                    mi.BookingPermission = BookingPermissions.Disallowed;
                    mi.Explanation = "The booking system is closed";
                }
                else
                {
                    mi.UpdatePermissions();
                }
                return mi;
            }
        }
        [HttpGet]
        [Route("parameters")]
        public async Task<bookingParameters> GetParameters()
        {
            bookingParameters pars = Factory.GetBookingParameters();
            await pars.Load(DataContext);
            return pars;
        }
        [HttpGet]
        [Route("calendar/{abodeId}/setup/info")]
        public dynamic GetCalendarSetupInfo(long abodeId)
        {
            // we dont use abodeId for now
            using (var ctx = new BookingDataContext())
            {
                try
                {
                    return ctx.GetCalendarSetupInfo();
                }
                catch (Exception xe)
                {
                    Log.Write(xe);
                    throw;
                }
            }
        }
        [HttpGet]
        [Route("calendar/{abodeId}/status")]
        public IEnumerable<dayInformation> GetDayStatus(long abodeId)
        {
            using (var ctx = new BookingDataContext())
            {
                var cs = ctx.GetCalendarSetupInfo();
                DateTime start = new DateTime(cs.StartAt.Year, cs.StartAt.Month, 1);// new DateTime(year, month, 1);
                var end = cs.Until.AddDays(1);
                DateTime until = new DateTime(end.Year, end.Month, DateTime.DaysInMonth(end.Year, end.Month));// start.AddMonths(1).AddDays(-1);
                List<DayInformation> dayList = new List<DayInformation>();
                for (DateTime day = start; day <= until; day = day.AddDays(1))
                {
                    DayInformation di = Factory.GetDayInformationInstance(ctx, abodeId, day);
                    if (di.Status != DayStatus.IsFree)
                    {
                        dayList.Add(di);
                    }
                }
                return dayList.Select(x => x.ToClientType()).ToArray();
            }
        }
        [HttpGet]
        [Route("calendar/{abodeId}/status/month/{year}/{month}")]
        public IEnumerable<dayInformation> GetDayStatus(long abodeId, int year, int month)
        {
            using (var ctx = new BookingDataContext())
            {
                DateTime start = new DateTime(year, month, 1);
                DateTime end = start.AddMonths(1).AddDays(-1);
                List<DayInformation> dayList = new List<DayInformation>();
                for (DateTime day = start; day <= end; day = day.AddDays(1))
                {
                    DayInformation di = Factory.GetDayInformationInstance(ctx, abodeId, day);
                    dayList.Add(di);
                }
                return dayList.Select(x => x.ToClientType()).ToArray();
            }
        }
        [HttpGet]
        [Route("get/choices/{abodeId}/{start}/{to}/{peoplecount}")]
        public availabilityInfo GetChoices(long abodeId, DateTime start, DateTime to, int peopleCount)
        {
            using (var ctx = new BookingDataContext())
            {

                DateTime end = to.AddDays(-1);
                List<DayInformation> dayList = new List<DayInformation>();
                for (DateTime day = start; day <= end; day = day.AddDays(1))
                {
                    DayInformation di = Factory.GetDayInformationInstance(ctx, abodeId, day);
                    dayList.Add(di);
                }
                var ai = new availabilityInfo();
                bool unavailable = dayList.Any(d => d.Status == DayStatus.IsClosed || d.Status == DayStatus.IsFull);
                if (unavailable)
                {
                    // at least one day is not possible
                    ai.success = false;
                    ai.explanation = "The hut is full (or closed) during this period";
                }
                else
                {
                    if (dayList.First().Status == DayStatus.IsNotBookable)
                    {
                        // TODO: first day  cannot be a not bookable - this is DWH customisation?
                        ai.success = false;
                        ai.explanation = "Bookings cannot start on this day";
                    }
                    else
                    {
                        var capacity = dayList.Select(x => new { Day = x.Day, Status = x.Status, AvailableBedCount = x.Accomodation.SelfAndDescendants.Count(zz => zz.Type == AccomodationType.Bed && zz.IsAvailableToBook) });
                        var insufficientAvailability = capacity.Any(x => x.AvailableBedCount < peopleCount);
                        if (insufficientAvailability)
                        {
                            // there is at least one day when there are not enough free beds
                            ai.success = false;
                            ai.explanation = "There is an insufficient number of free beds during this period";
                        }
                        else
                        {
                            MemberBase member = this.GetCurrentMember();
                            var choices = CreateChoices(peopleCount, dayList);
                            ai.success = true;
                            var common = DailyChoices.SelectCommonChoices(choices);
                            foreach (var choice in common)
                            {
                                choice.CostPerDay = new List<CostPerDay>();
                                foreach (DateTime dt in choices.Select(x => x.Day))
                                {
                                    decimal cost = 0.0M;
                                    foreach (var aa in choice.Accomodation)
                                    {
                                        cost += ctx.GetPrice(member, dt, aa.Type, aa.Class, aa.Capacity);
                                    }
                                    choice.CostPerDay.Add(new CostPerDay { Day = dt, Cost = cost });
                                }
                            }
                            foreach (var choice in common)
                            {
                                // only select choices that are different inpractice, e.g. for DWH 1 Hut = 1 4-bed room plus 8 beds = 12 beds
                                var existing = GetExistingChoice(ai.choices, choice);
                                if (existing == null)
                                {
                                    ai.AddChoice(choice);
                                }
                                else
                                {
                                    var t = choice.ToClientType();
                                    if(t.totalCost < existing.totalCost)
                                    {
                                        ai.choices.Remove(existing);
                                        ai.choices.Add(t);
                                    }
                                }
                            }
                            var filter = Factory.GetChoiceFilter();
                            ai = filter.FilterChoices(start, to, ai);
                            ai.choices = ai.choices.OrderBy(x => x.totalCost).ToList();
                        }
                    }
                }
                return ai;
            }
        }
        [HttpPost]
        [Route("create")]
        public async Task<dynamic> MakeBooking(bookingRequest request)
        {
            // default isolation level is Serializable, meaning no one else can do anything
            string reference = null;
            using (var tran = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled))
            {
                try
                {
                    using (var ctx = new BookingDataContext())
                    {
                        Func<string> newBookingReference = () =>
                        {
                            DateTime today = BookingGlobals.GetToday();
                            int bookingsToday = ctx.Bookings.ToArray().Where(x => x.CreatedOn.Year == today.Year && x.CreatedOn.Month == today.Month).Count();
                            return string.Format("{0}/{1}", today.ToString("MMMyy"), (bookingsToday + 1).ToString("00#"));
                        };
                        DateTime from = DateTime.Parse(request.fromDate);
                        DateTime to = DateTime.Parse(request.toDate);
                        to = to.AddDays(-1);
                        List<Accomodation> toBeBooked = new List<Accomodation>();
                        foreach (var item in request.choice.accomodationItems)
                        {
                            var a = await ctx.AccomodationSet.FindAsync(item.id);
                            if (a == null)
                            {
                                throw new Exception(string.Format("Accomodation item {0} not found: system error!", item.id));
                            }
                            else
                            {
                                var overlapping = a.Bookings.Where(ex => ex.From <= to && from <= ex.To);
                                if(overlapping.Count() > 0)
                                {
                                    return new { Success = false, Error = "Accomodation no longer available", Code = "AvailabilityLost" };
                                }
                                else
                                {
                                    toBeBooked.Add(a);
                                }
                            }
                        }
                        // we can make this booking
                        Booking b = new Booking
                        {
                            CreatedOn = BookingGlobals.GetToday(),
                            EntryInformation = null,
                            From = from,// request.fromDate,
                            IsPaid = false,
                            MemberId = this.GetCurrentMember().Id,
                            Notes = null,
                            Reference = newBookingReference(),
                            To = to, //request.toDate,
                            TotalCost = request.choice.totalCost,
                            Under18sInParty = request.under18spresent
                        };
                        foreach(var a in toBeBooked)
                        {
                            b.AccomodationCollection.Add(a);
                        }
                        ctx.Bookings.Add(b);
                        await ctx.SaveChangesAsync();
                        tran.Complete();
                        //
                        reference = b.Reference;

                    }

                }
                catch (Exception xe)
                {
                    Log.Write(xe);
                    return new { Success = false, Error = xe.Message, Code = "SystemError" };
                }
            }
            return new
            {
                Success = true,
                Error = string.Empty,
                BookingReference = reference,
                MemberEmailAddress = this.GetCurrentMember().EmailAddress,
                BookingSecretaryEmailAddress = Globals.GetBookingSecretaryEmailAddress()
            };
        }
        private bookingChoice GetExistingChoice(List<bookingChoice> list, BookingChoice choice)
        {
            bookingChoice result = null;
            var choiceSet = choice.Accomodation.SelectMany(x => x.SelfAndDescendants).Where(x => x.Type == AccomodationType.Bed).Select(x => x.AccomodationId);
            foreach (var existing in list)
            {
                var existingSet = existing.accomodationItems.Select(x => x.id);
                if (choiceSet.Except(existingSet).Count() == 0)
                {
                    result = existing;
                    break;
                }
            }
            return result;
        }
        private IEnumerable<DailyChoices> CreateChoices(int peopleCount, List<DayInformation> dayList)
        {
            List<BookingChoice> choices = new List<BookingChoice>();
            List<DailyChoices> dcsList = new List<DailyChoices>();
            foreach (var day in dayList)
            {
                var dcs = new DailyChoices();
                dcs.Day = day.Day;
                foreach (AccomodationType at in Enum.GetValues(typeof(AccomodationType)))
                {
                    var list = day.FindAvailableAccomodation(at);
                    if (list.Count() > 0)
                    {
                        int capacity = list.Select(l => l.SelfAndDescendants.Count(x => x.Type == AccomodationType.Bed)).Sum();
                        if (capacity == peopleCount)
                        {
                            var bc = new BookingChoice { Day = day.Day, Accomodation = list, Capacity = capacity };
                            dcs.Choices.Add(bc);
                            choices.Add(bc);
                        }
                        else
                        {
                            switch (at)
                            {
                                case AccomodationType.Bed:
                                    var bc = new BookingChoice { Day = day.Day };
                                    bc.Accomodation = list.Take(peopleCount);
                                    bc.Capacity = peopleCount;
                                    dcs.Choices.Add(bc);
                                    choices.Add(bc);
                                    break;
                                case AccomodationType.Room:
                                    var wholeRooms = day.FindWholeRooms(list, peopleCount);
                                    // wholerooms maybe the same as the whole of the level above
                                    foreach (var wr in wholeRooms)
                                    {
                                        int roomCapacity = wr.Sum(x => x.Capacity);
                                        if (roomCapacity >= peopleCount)
                                        {
                                            var bc2 = new BookingChoice { Day = day.Day };
                                            bc2.Accomodation = wr;
                                            bc2.Capacity = wr.Sum(x => x.Capacity);
                                            dcs.Choices.Add(bc2);
                                            choices.Add(bc2);
                                        }
                                    }
                                    var splitAccomdation = day.FindSplitAccomodation(list, peopleCount, day.FindAvailableAccomodation(AccomodationType.Bed));
                                    foreach (var sa in splitAccomdation)
                                    {
                                        var bc2 = new BookingChoice { Day = day.Day };
                                        bc2.Accomodation = sa;
                                        bc2.Capacity = sa.Sum(x => x.Capacity);
                                        dcs.Choices.Add(bc2);
                                        choices.Add(bc2);
                                    }
                                    break;
                                case AccomodationType.Hut:
                                    var bc3 = new BookingChoice { Day = day.Day };
                                    bc3.Accomodation = list.Take(1);
                                    bc3.Capacity = bc3.Accomodation.First().Capacity;
                                    dcs.Choices.Add(bc3);
                                    choices.Add(bc3);
                                    break;
                            }
                        }
                        //Debug.Print("Day {0}: {2}(s) {1} available, capacity: {3}", day.Day.ToDefault(), at.ToString(), list.Count(), capacity);
                    }
                }
                dcsList.Add(dcs);
                Debug.Print("{0}", dcs.ToString());
            }
            return dcsList;
        }
        [HttpGet]
        [Route("test1")]
        public dynamic Test1()
        {
            long abodeId = 1;
            using (var ctx = new BookingDataContext())
            {
                DateTime start = new DateTime(2015, 9, 21);
                DayInformation di = Factory.GetDayInformationInstance(ctx, abodeId, start);
                dynamic r = di.ToClientType();
                return r;
            }
        }
        [HttpGet]
        [Route("test2")]
        public dynamic[] Test2()
        {
            long abodeId = 1;
            using (var ctx = new BookingDataContext())
            {
                DateTime start = new DateTime(2015, 9, 21);
                DateTime end = new DateTime(2015, 10, 21);
                List<DayInformation> dayList = new List<DayInformation>();
                for (DateTime day = start; day <= end; day = day.AddDays(1))
                {
                    DayInformation di = Factory.GetDayInformationInstance(ctx, abodeId, day);
                    dayList.Add(di);
                }
                return dayList.Select(x => x.ToClientType()).ToArray();
            }
        }
        [HttpGet]
        [Route("test3")]
        public dynamic[] Test3()
        {
            DayInformation one;
            DayInformation two;
            DayInformation three;
            DayInformation four;
            long abodeId = 1;
            Debug.Print("test 1 ...");
            using (var ctx = new BookingDataContext())
            {
                DateTime start = new DateTime(2015, 9, 21);
                //one =  DayInformation2.GetDayInformation(ctx, start);
                //four =  DayInformation2.GetDayInformation(ctx, start);
                one = Factory.GetDayInformationInstance(ctx, abodeId, start);
                //four = Factory.GetDayInformationInstance(ctx, start);
            }
            using (var ctx = new BookingDataContext())
            {
                DateTime start = new DateTime(2015, 9, 21);
                DateTime end = new DateTime(2015, 12, 21);
                //DayInformation2 cached = null;
                List<DayInformation> dayList = new List<DayInformation>();
                for (DateTime day = start; day <= end; day = day.AddDays(1))
                {
                    DayInformation di = Factory.GetDayInformationInstance(ctx, abodeId, day);// DayInformation2.GetDayInformation(ctx, day);
                    //if (cached == null)
                    //{
                    //    cached = di;
                    //}
                    //dayList.Add(di);
                    //var fi = dayList.First();
                    //Debug.Print("After adding {0}, on {1} {2}, Accomodation.Count() = {3}, SelfAndDescendants.Count() = {4}: {5}", day.ToString("ddMMMyyyy"),
                    //    cached.Day.ToString("ddMMMyyyy"),
                    //    cached.GetAvailabilitySummary(), cached.Accomodation.Count(),
                    //    cached.Accomodation.First().SelfAndDescendants.Count(),
                    //    string.Join(", ", cached.Accomodation.First().SelfAndDescendants.Select(x => string.Format("{0}", x.IsAvailableToBook)).ToArray()),
                    //    string.Join(", ", cached.Accomodation.First().SelfAndDescendants
                    //    .Select(x => string.Format("{0}", x.Bookings.Count())).ToArray())
                    //    );
                }
            }
            Debugger.Break();
            return null;
        }
    }
}
