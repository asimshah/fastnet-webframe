using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.WebApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Http;
using System.Data.Entity;
using System.Diagnostics;
using System.Transactions;
using Fastnet.Common;

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
                var bookings = await ctx.Bookings.Where(x => x.Status != bookingStatus.Cancelled && (x.To >= today || x.IsPaid == false))
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
                var bookings = await ctx.Bookings.Where(x => x.Status != bookingStatus.Cancelled && (x.To < today && x.IsPaid == true)).OrderBy(x => x.Reference).ToArrayAsync();
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
                var bookings = await ctx.Bookings.Where(x => x.Status == bookingStatus.Cancelled).OrderBy(x => x.Reference).ToArrayAsync();
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
        [HttpPost]
        [Route("update/booking/{id}/paidstate/{paid}")]
        public void UpdateBooking(long id, bool paid)
        {
            using (var ctx = new BookingDataContext())
            {
                var m = this.GetCurrentMember();
                var name = m.Fullname;
                var booking = ctx.Bookings.Find(id);
                var today = BookingGlobals.GetToday();

                if(booking != null)
                {
                    booking.IsPaid = paid;
                    booking.AddHistory(name, string.Format("Mark as {0}", paid ? "paid" : "not paid"));
                    ctx.SaveChanges();
                }

            }
        }
        [HttpPost]
        [Route("update/booking")]
        public void UpdateBooking(dynamic data)
        {
            long id = data.bookingId;
            string number = data.memberPhoneNumber;
            string notes = data.notes;
            using (var tran = new TransactionScope())
            {
                using (var ctx = new BookingDataContext())
                {
                    var booking = ctx.Bookings.Find(id);
                    if (booking != null)
                    {
                        var mf = MemberFactory.GetInstance();
                        MemberBase m = mf.Find(DataContext, booking.MemberId);
                        if (m.PhoneNumber != number)
                        {
                            m.PhoneNumber = number;
                        }
                        if (booking.Notes != notes)
                        {
                            booking.Notes = notes;
                        }
                        ctx.SaveChanges();
                        DataContext.SaveChanges();
                        tran.Complete();
                    }
                } 
            }
        }
        [HttpPost]
        [Route("update/booking/{id}/status/{status}")]
        public void UpdateBooking(long id, bookingStatus status)
        {
            using (var ctx = new BookingDataContext())
            {
                var m = this.GetCurrentMember();
                var name = m.Fullname;
                var booking = ctx.Bookings.Find(id);
                var today = BookingGlobals.GetToday();
                if(booking.Status != status)
                {
                    bookingStatus old = booking.Status;
                    booking.Status = status;
                    booking.AddHistory(name, string.Format("Status changed from {0} to {1}", old.ToString(), booking.Status.ToString()));
                    ctx.SaveChanges();
                }
            }
        }
        [HttpGet]
        [Route("get/entrycodes")]
        public dynamic GetEntryCodes()
        {
            using (var ctx = new BookingDataContext())
            {
                try
                {
                    DateTime today = BookingGlobals.GetToday();
                    DateTime startListAt = today.AddMonths(-1);
                    startListAt = new DateTime(startListAt.Year, startListAt.Month, 1);
                    var entryCodes = ctx.EntryCodes.OrderBy(x => x.ApplicableFrom).ToArray();
                    var allCodes = entryCodes.Where(x => x.ApplicableFrom >= startListAt).Select(x => new entryCode(x));
                    EntryCode current = entryCodes.Where(x => x.ApplicableFrom <= today).LastOrDefault();
                    EntryCode next = null;
                    if (current != null)
                    {
                        next = entryCodes.Where(x => x.ApplicableFrom > current.ApplicableFrom).OrderBy(x => x.ApplicableFrom).FirstOrDefault();
                    }
                    return new
                    {
                        currentEntryCode = current != null ? new entryCode(current) : null,
                        validFrom = current?.ApplicableFrom.ToDefault(),
                        validTo = next?.ApplicableFrom.AddDays(-1).ToDefault(),
                        allCodes = allCodes
                    };
                }
                catch (Exception)
                {
                    
                    throw;
                }
            }
        }
        [HttpPost]
        [Route("add/entrycode")]
        public void AddEntryCode(dynamic data)
        {
            string afd = data.from;
            string code = data.code;
            DateTime from = DateTime.Parse(afd);
            using (var ctx = new BookingDataContext())
            {
                EntryCode ec = ctx.EntryCodes.SingleOrDefault(x => x.ApplicableFrom == from);
                if(ec == null)
                {
                    ec = new EntryCode();
                    ec.ApplicableFrom = from;
                    ctx.EntryCodes.Add(ec);
                }
                ec.Code = code;
                ctx.SaveChanges();
            }
        }
        [HttpPost]
        [Route("remove/entrycode/{id}")]
        public void RemoveEntryCode(long id)
        {
            using (var ctx = new BookingDataContext())
            {
                EntryCode ec = ctx.EntryCodes.Find(id);
                if (ec != null)
                {
                    ctx.EntryCodes.Remove(ec);
                    ctx.SaveChanges();
                }
            }
        }
    }
}
