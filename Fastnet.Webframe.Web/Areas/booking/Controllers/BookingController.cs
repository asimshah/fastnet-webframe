using Fastnet.EventSystem;
using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.WebApi;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

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
        public async Task<Parameters> GetParameters()
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
                Parameters pars = new Parameters();
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
        [Route("calendar/status/day/{date}")]
        public async Task<dynamic> GetDayStatus(DateTime date)
        {
            using (var ctx = new BookingDataContext())
            {
                DayInformation di = await ctx.GetDayInformation(date);
                di.StatusDisplay = di.ToString();
                di.Accomodation = null;// N.B (a) di.Accomodation needed for di.ToString(), (b) nulled to reduce payload
                return di;
            }
        }
        [HttpGet]
        [Route("calendar/status/month/{year}/{month}")]
        public async Task<dynamic> GetDayStatus(int year, int month)
        {
            DateTime start = new DateTime(year, month, 1);
            DateTime end = start.AddMonths(1).AddDays(-1);
            return await GetDayStatusForDateRange(start, end);
        }
        //[HttpGet]
        //[Route("calendar/status/from/{start}/to/{end}")]
        //public async Task<dynamic> GetDayStatus(DateTime start, DateTime end)
        //{
        //    return await GetDayStatusForDateRange(start, end);
        //}
        [HttpGet]
        [Route("checkavailability/{start}/{to}/{peoplecount}")]
        public async Task<AvailabilityInfo> GetRequestedBookings(DateTime start, DateTime to, int peopleCount)
        {
            AvailabilityInfo ai = new AvailabilityInfo();
            DateTime end = to.AddDays(-1);
            var dayList = await GetDayStatusForDateRange(start, end, false);
            bool unavailable = dayList.Any(d => d.Status == DayStatus.IsClosed || d.Status == DayStatus.IsFull);
            if (unavailable)
            {
                // at least one day is not possible
                ai.Success = false;
                ai.Explanation = "The hut is full (or closed) during this period";
            }
            else
            {
                if(dayList.First().Status == DayStatus.IsNotBookable)
                {
                    // first day  cannot be a not bookable - this is DWH customisation?
                    ai.Success = false;
                    ai.Explanation = "Bookings cannot start on a Saturday";
                }
                else
                {
                    var freeBeds = dayList.Where(x => x.Status == DayStatus.IsFree || x.Status == DayStatus.IsPartBooked)
                        .Select(d => new { Date = d.Day, Beds = d.Accomodation.SelectMany(z => z.SelfAndDescendants).Count(z => z.Type == AccomodationType.Bed && z.IsAvailableToBook) });
                    //var freeBeds = dayList.Where(x => x.Status == DayStatus.IsFree || x.Status == DayStatus.IsPartBooked).Select(d => new { Date = d.Day, Beds = d.Accomodation.Count(a => a.Type == AccomodationType.Bed && a.IsAvailableToBook) });
                    var insufficientAvailability = freeBeds.Any(x => x.Beds < peopleCount);
                    if(insufficientAvailability)
                    {
                        // there is at least one day when there are not enough free beds
                        ai.Success = false;
                        ai.Explanation = "There is an insufficient number of free beds during this period";
                    }
                    else
                    {
                        ai.Success = true;
                    }
                }
            }
            return ai;
        }
        [HttpGet]
        [Route("test/{emailAddress}")]
        public async Task<dynamic> Test(string emailAddress)
        {
            await Task.Delay(3000);
            return  new { Success = false, Error = "Always false during testing (delay 3 secs)" };
        }
        private async Task<List<DayInformation>> GetDayStatusForDateRange(DateTime start, DateTime end, bool reducePayload = true)
        {
            using (var ctx = new BookingDataContext())
            {
                List<DayInformation> dayList = new List<DayInformation>();
                for (DateTime day = start; day <= end; day = day.AddDays(1))
                {
                    DayInformation di = await ctx.GetDayInformation(day);
                    switch (di.Status)
                    {
                        case DayStatus.IsClosed:
                        case DayStatus.IsFull:
                        case DayStatus.IsPartBooked:
                        case DayStatus.IsNotBookable:
                        case DayStatus.IsFree:
                            di.StatusDisplay = di.ToString();
                            if (reducePayload)
                            {
                                di.Accomodation = null;// N.B (a) di.Accomodation needed for di.ToString(), (b) nulled to reduce payload    
                            }                      
                            dayList.Add(di);
                            break;
                    }
                }
                return dayList;
            }
        }
    }
}
