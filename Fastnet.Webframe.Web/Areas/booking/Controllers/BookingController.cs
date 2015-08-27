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
        public dynamic GetMember()
        {
            MemberBase m = this.GetCurrentMember();
            if(m.IsAnonymous)
            {
                return new { anonymous = true };
            }
            else
            {
                return new { anonymous = false, memberId = m.Id, fullname = m.Fullname };
            }
        }
        [HttpGet]
        [Route("calendar/setup/info")]
        public dynamic GetCalendarSetupInfo()
        {
            using (var ctx = new BookingDataContext())
            {
                Parameter p = ctx.Parameters.Single();
                Period fp = p.ForwardBookingPeriod;
                DateTime start = BookingGlobals.GetToday();
                DateTime end;
                switch(fp.PeriodType)
                {
                    case PeriodType.Fixed:
                        if(!fp.EndDate.HasValue)
                        {
                            var xe = new ApplicationException("Fixed Forward booking period must have an end date");
                            Log.Write(xe);
                            throw xe;
                        }
                        start = new[] { fp.StartDate.Value, start }.Max();
                        end = fp.EndDate.Value;
                        break;
                    case PeriodType.Rolling:
                        end = fp.GetRollingEndDate(start);
                        break;
                    default:
                        var xe2 = new ApplicationException("No valid Forward booking period available");
                        Log.Write(xe2);
                        throw xe2;
                }
                return new { startAt = start, until = end };
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
        [HttpGet]
        [Route("calendar/status/from/{start}/to/{end}")]
        public async Task<dynamic> GetDayStatus(DateTime start, DateTime end)
        {
            return await GetDayStatusForDateRange(start, end);
        }

        private static async Task<dynamic> GetDayStatusForDateRange(DateTime start, DateTime end)
        {
            using (var ctx = new BookingDataContext())
            {
                Stopwatch sw = new Stopwatch();
                sw.Start();
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
                            di.StatusDisplay = di.ToString();
                            di.Accomodation = null;// N.B (a) di.Accomodation needed for di.ToString(), (b) nulled to reduce payload                          
                            dayList.Add(di);
                            break;
                    }
                }
                sw.Stop();
                Debug.Print("GetDayStatus(), from {0} to {1}, {2} ms for {3} items",
                    start.ToString("ddMMMyyyy"), end.ToString("ddMMMyyyy"), sw.ElapsedMilliseconds, dayList.Count());
                return dayList;
            }
        }
    }
}
