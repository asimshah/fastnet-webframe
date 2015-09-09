using Fastnet.EventSystem;
using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.Web.Areas.booking.Common;
using Fastnet.Webframe.WebApi;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Dynamic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using Fastnet.Common;

namespace Fastnet.Webframe.Web.Areas.booking.Controllers
{
    [RoutePrefix("bookingapi")]
    public class BookingController : BaseApiController
    {
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
            if(m.IsAnonymous)
            {
                return new MemberInfo { Anonymous = true };
            }
            else
            {
                var mi = Factory.GetMemberInfo();
                mi.Anonymous = false;
                mi.MemberId = m.Id;
                mi.Fullname = m.Fullname;
                mi.UpdatePermissions();
                return mi;
            }
        }
        [HttpGet]
        [Route("parameters")]
        public async Task<BookingParameters> GetParameters()
        {
            using (var ctx = new BookingDataContext())
            {
                var allAccomodation = await ctx.GetTotalAccomodation();
                int bedCount = 0;
                foreach(var accomodation in allAccomodation)
                {
                    foreach(var item in accomodation.SelfAndDescendants)
                    {
                        if(item.Type == AccomodationType.Bed)
                        {
                            bedCount++;
                        }
                    }
                }
                BookingParameters pars = new BookingParameters();
                pars.FactoryName = Factory.FactoryName.ToString();
                pars.MaximumOccupants = bedCount;
                return pars;
            }

        }
        [HttpGet]
        [Route("calendar/setup/info")]
        public dynamic GetCalendarSetupInfo()
        {
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
        [Route("calendar/status/month/{year}/{month}")]
        public IEnumerable<dayInformation> GetDayStatus(int year, int month)
        {
            using (var ctx = new BookingDataContext())
            {
                DateTime start = new DateTime(year, month, 1);
                DateTime end = start.AddMonths(1).AddDays(-1);
                List<DayInformation> dayList = new List<DayInformation>();
                for (DateTime day = start; day <= end; day = day.AddDays(1))
                {
                    DayInformation di = Factory.GetDayInformationInstance(ctx, day);
                    dayList.Add(di);
                }
                return dayList.Select(x => x.ToClientType()).ToArray();
            }
        }
        [HttpGet]
        [Route("checkavailability/{start}/{to}/{peoplecount}")]
        public AvailabilityInfo GetRequestedBookings(DateTime start, DateTime to, int peopleCount)
        {
            using (var ctx = new BookingDataContext())
            {

                DateTime end = to.AddDays(-1);
                List<DayInformation> dayList = new List<DayInformation>();
                for (DateTime day = start; day <= end; day = day.AddDays(1))
                {
                    DayInformation di = Factory.GetDayInformationInstance(ctx, day);
                    dayList.Add(di);
                }
                AvailabilityInfo ai = new AvailabilityInfo();
                bool unavailable = dayList.Any(d => d.Status == DayStatus.IsClosed || d.Status == DayStatus.IsFull);
                if (unavailable)
                {
                    // at least one day is not possible
                    ai.Success = false;
                    ai.Explanation = "The hut is full (or closed) during this period";
                }
                else
                {
                    if (dayList.First().Status == DayStatus.IsNotBookable)
                    {
                        // TODO: first day  cannot be a not bookable - this is DWH customisation?
                        ai.Success = false;
                        ai.Explanation = "Bookings cannot start on this day";
                    }
                    else
                    {
                        var capacity = dayList.Select(x => new { Day = x.Day, Status = x.Status,  AvailableBedCount = x.Accomodation.SelectMany(z => z.SelfAndDescendants).Count(zz => zz.Type == AccomodationType.Bed && zz.IsAvailableToBook) });
                        var insufficientAvailability = capacity.Any(x => x.AvailableBedCount < peopleCount);
                        if (insufficientAvailability)
                        {
                            // there is at least one day when there are not enough free beds
                            ai.Success = false;
                            ai.Explanation = "There is an insufficient number of free beds during this period";
                        }
                        else
                        {
                            var choices = CreateChoices(peopleCount, dayList);
                            ai.Success = true;

                            var r = BookingChoice.SelectCommonChoices(choices);
                            foreach (var choice in r)
                            {
                                choice.AddPrices(ctx);
                                //Debug.Print("{0}: {1}", choice.Day.ToDefault(), choice.ToString());
                            }

                        }
                    }
                }
                return ai;
            }


        }

        private IEnumerable<BookingChoice> CreateChoices(int peopleCount, List<DayInformation> dayList)
        {
            List<BookingChoice> choices = new List<BookingChoice>();
            foreach(var day in dayList)
            {
                foreach (AccomodationType at in Enum.GetValues(typeof(AccomodationType)))
                {
                    var list = day.FindAvailableAccomodation(at);
                    if (list.Count() > 0)
                    {
                        int capacity = list.Select(l => l.SelfAndDescendants.Count(x => x.Type == AccomodationType.Bed)).Sum();
                        if (capacity == peopleCount)
                        {
                            var bc = new BookingChoice { Day = day.Day, Accomodation = list, Capacity = capacity };
                            choices.Add(bc);
                        }
                        else //if (capacity > peopleCount)
                        {
                            // TODO: decide if this needs (a) generalisation for all accomodation types,
                            // and/or (b) customisation for DWH
                           
                            switch (at)
                            {
                                case AccomodationType.Bed:
                                    var bc = new BookingChoice { Day = day.Day };
                                    bc.Accomodation = list.Take(peopleCount);
                                    bc.Capacity = peopleCount;
                                    choices.Add(bc);
                                    break;
                                case AccomodationType.Room:
                                    var wholeRooms = day.FindWholeRooms(list, peopleCount);
                                    // wholerooms maybe the same as the whole of the level above
                                    foreach(var wr in wholeRooms)
                                    {
                                        var bc2 = new BookingChoice { Day = day.Day };
                                        bc2.Accomodation = wr;
                                        bc2.Capacity = wr.Sum(x => x.Capacity);
                                        choices.Add(bc2);
                                    }
                                    var splitAccomdation = day.FindSplitAccomodation(list, peopleCount, day.FindAvailableAccomodation(AccomodationType.Bed));
                                    foreach (var sa in splitAccomdation)
                                    {
                                        var bc2 = new BookingChoice { Day = day.Day };
                                        bc2.Accomodation = sa;
                                        bc2.Capacity = sa.Sum(x => x.Capacity);
                                        choices.Add(bc2);
                                    }
                                    break;
                                case AccomodationType.Hut:
                                    var bc3 = new BookingChoice { Day = day.Day };
                                    bc3.Accomodation = list.Take(1);
                                    bc3.Capacity = bc3.Accomodation.First().Capacity;
                                    choices.Add(bc3);
                                    break;
                            }
                        }
                        Debug.Print("Day {0}: {2}(s) {1} available, capacity: {3}", day.Day.ToString("ddMMMyyyy"), at.ToString(), list.Count(), capacity);
                    }
                }
            }
            return choices;
        }
        [HttpGet]
        [Route("test1")]
        public dynamic Test1()
        {
            using (var ctx = new BookingDataContext())
            {
                DateTime start = new DateTime(2015, 9, 21);
                DayInformation di = Factory.GetDayInformationInstance(ctx, start);
                dynamic r = di.ToClientType();
                return r;
            }
        }
        [HttpGet]
        [Route("test2")]
        public dynamic[] Test2()
        {
            using (var ctx = new BookingDataContext())
            {
                DateTime start = new DateTime(2015, 9, 21);
                DateTime end = new DateTime(2015, 10, 21);
                List<DayInformation> dayList = new List<DayInformation>();
                for (DateTime day = start; day <= end; day = day.AddDays(1))
                {
                    DayInformation di = Factory.GetDayInformationInstance(ctx, day);
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
            Debug.Print("test 1 ...");
            using (var ctx = new BookingDataContext())
            {
                DateTime start = new DateTime(2015, 9, 21);
                //one =  DayInformation2.GetDayInformation(ctx, start);
                //four =  DayInformation2.GetDayInformation(ctx, start);
                one = Factory.GetDayInformationInstance(ctx, start);
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
                    DayInformation di = Factory.GetDayInformationInstance(ctx, day);// DayInformation2.GetDayInformation(ctx, day);
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
        //private void CreateChoices(int peopleCount, List<DayInformation> dayList)
        //{
        //    var firstDayAccomodation = dayList.First().Accomodation;
        //}

    }
}
