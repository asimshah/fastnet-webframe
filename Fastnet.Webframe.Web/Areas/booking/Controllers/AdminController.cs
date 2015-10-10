using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.WebApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Http;
using System.Data.Entity;

namespace Fastnet.Webframe.Web.Areas.booking.Controllers
{
    [RoutePrefix("bookingadmin")]
    //[PermissionFilter(SystemGroups.Administrators)]
    public class AdminController : BaseApiController
    {
        private CoreDataContext DataContext = Core.GetDataContext();
        [HttpPost]
        [Route("save/parameters")]
        public void SaveAdminParameters(dynamic data)
        {
            var paras = Factory.GetBookingParameters();
            paras.Save();
        }
        [HttpGet]
        [Route("get/bookings/{abodeId}/{unpaidOnly?}")]
        public async Task<IEnumerable<booking>> GetBookings(long abodeId, bool unpaidOnly = false)
        {
            using (var ctx = new BookingDataContext())
            {
                var today = BookingGlobals.GetToday();                
                var bookings = await ctx.Bookings.Where(x => x.Status != BookingStatus.Cancelled && (x.To >= today || x.IsPaid == false))
                    .Where(x => unpaidOnly == false || x.IsPaid == false)
                    .OrderBy(x => x.Reference).ToArrayAsync();
                var data = bookings.Select(x => Factory.GetBooking(DataContext, x));
                return data;
            }
        }
        [HttpGet]
        [Route("get/bookings/history/{abodeId}/")]
        public async Task<IEnumerable<booking>> GetHistoricBookings(long abodeId)
        {
            using (var ctx = new BookingDataContext())
            {
                var today = BookingGlobals.GetToday();
                var bookings = await ctx.Bookings.Where(x => x.Status != BookingStatus.Cancelled && (x.To < today && x.IsPaid == true)).OrderBy(x => x.Reference).ToArrayAsync();
                var data = bookings.Select(x => Factory.GetBooking(DataContext, x));
                return data;
            }
        }
        [HttpGet]
        [Route("get/bookings/cancelled/{abodeId}/")]
        public async Task<IEnumerable<booking>> GetCancelledBookings(long abodeId)
        {
            using (var ctx = new BookingDataContext())
            {
                var today = BookingGlobals.GetToday();
                var bookings = await ctx.Bookings.Where(x => x.Status == BookingStatus.Cancelled).OrderBy(x => x.Reference).ToArrayAsync();
                var data = bookings.Select(x => Factory.GetBooking(DataContext, x));
                return data;
            }
        }
        [HttpGet]
        [Route("get/occupancy/{abodeId}/{fromYear}/{fromMonth}/{toYear}/{toMonth}")]
        public dayInformation[] GetOccupancy(long abodeId, int fromYear, int fromMonth, int toYear, int toMonth)
        {
            using (var ctx = new BookingDataContext())
            {
                var cal = ctx.GetCalendarSetupInfo();

                DateTime start = new DateTime(fromYear, fromMonth, 1);
                DateTime end = new DateTime(toYear, toMonth, DateTime.DaysInMonth(toYear, toMonth));
                start = cal.StartAt > start ? cal.StartAt : start;
                end = cal.Until < end ? cal.Until : end;
                if (end < start)
                {
                    end = new DateTime(start.Year, start.Month, DateTime.DaysInMonth(start.Year, start.Month));
                }
                List<DayInformation> dayList = new List<DayInformation>();
                for (DateTime day = start; day <= end; day = day.AddDays(1))
                {
                    DayInformation di = Factory.GetDayInformationInstance(ctx, abodeId, day);
                    dayList.Add(di);
                }
                return dayList.Select(x => x.ToClientType(true, true, DataContext)).ToArray();
            }
        }
    }
}
