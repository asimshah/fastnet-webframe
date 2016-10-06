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
using System.Dynamic;
using Fastnet.Webframe.Web.Areas.bookings;
using Fastnet.EventSystem;
using Newtonsoft.Json.Linq;

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
            paras.termsAndConditionsUrl = data.termsAndConditionsUrl;
            if (paras is dwhBookingParameters)
            {
                var p = paras as dwhBookingParameters;
                p.paymentInterval = data.paymentInterval;
                p.entryCodeNotificationInterval = data.entryCodeNotificationInterval;
                p.entryCodeBridgeInterval = data.entryCodeBridgeInterval;
                p.cancellationInterval = data.cancellationInterval;
                p.firstReminderInterval = data.firstReminderInterval;
                p.secondReminderInterval = data.secondReminderInterval;
                p.reminderSuppressionInterval = data.reminderSuppressionInterval;
                dynamic group = (JObject)data.privilegedMembers;
                long id = group.Id;
                string name = group.Name;
                p.privilegedMembers = new IGroup { Id = id, Name = name };
            }
            paras.Save();
        }
        [HttpGet]
        [Route("get/bookings/{abodeId}/{unpaidOnly?}")]
        public async Task<IEnumerable<booking>> GetBookings(long abodeId, bool unpaidOnly = false)
        {
            using (var ctx = new BookingDataContext())
            {
                try
                {
                    var today = BookingGlobals.GetToday();
                    var bookings = await ctx.Bookings.Where(x => x.Status != bookingStatus.Cancelled && (x.To >= today || x.IsPaid == false))
                        .Where(x => unpaidOnly == false || x.IsPaid == false)
                        .OrderBy(x => x.Reference).ToArrayAsync();
                    //var data = bookings.Select(x => Factory.GetBooking(DataContext, x));
                    var data = bookings.Select(x => Factory.GetBooking(x));
                    return data.ToArray();
                }
                catch (Exception xe)
                {
                    Log.Write(xe);
                    throw;
                }
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
                var data = bookings.Select(x => Factory.GetBooking( x));
                return data.ToArray();
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
                var data = bookings.Select(x => Factory.GetBooking( x)).ToArray();
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
            //long abodeId = 1;
            using (var ctx = new BookingDataContext())
            {
                var m = this.GetCurrentMember();
                var name = m.Fullname;
                var booking = ctx.Bookings.Find(id);
                var today = BookingGlobals.GetToday();

                if (booking != null)
                {
                    SetPaid(ctx, booking, paid, name);
                    ctx.SaveChanges();
                }
            }
            StartStandardTasks();
        }

        private void SetPaid(BookingDataContext ctx, Booking booking, bool paid, string memberFullname, long abodeId = 1)
        {
            booking.SetPaid(ctx, memberFullname, paid, abodeId);
            booking.PerformStateTransition(GetCurrentMember().Fullname, ctx, booking.Status, bookingStatus.Confirmed, false);
            //bookingStatus oldStatus = booking.Status;
            //booking.Status = bookingStatus.Confirmed;
            //booking.IsPaid = paid;
            //booking.AddHistory(name, string.Format("Mark as {0}", paid ? "paid" : "not paid"));
            //var bst = Factory.GetBookingStateTransition(ctx, abodeId);
            //if (booking.Status != oldStatus)
            //{
            //    booking.StatusLastChanged = DateTime.Now;
            //    bst.ChangeState(booking, oldStatus);
            //}
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
        [Route("approve/booking/{id}")]
        public void ApproveBooking(long id)
        {
            long abodeId = 1;
            using (var ctx = new BookingDataContext())
            {
                var m = this.GetCurrentMember();
                var name = m.Fullname;
                var booking = ctx.Bookings.Find(id);
                var bookingMember = DataContext.Members.Find(booking.MemberId);
                var today = BookingGlobals.GetToday();
                if (booking.Status == bookingStatus.WaitingApproval)
                {
                    //var pars = Factory.GetBookingParameters() as dwhBookingParameters;
                    //pars.Load(DataContext);
                    //Group privileged = DataContext.Groups.Find(pars.privilegedMembers.Id);
                    //bool isPrivileged = bookingMember.IsMemberOf(privileged);
                    //bookingStatus old = booking.Status;
                    //booking.Status = isPrivileged ? bookingStatus.Confirmed : bookingStatus.WaitingPayment;
                    //booking.StatusLastChanged = DateTime.Now;

                    var bst = Factory.GetBookingStateTransition(ctx, abodeId);
                    bookingStatus postApproval = bst.GetPostApprovalState(booking);
                    booking.PerformStateTransition(name, ctx, bookingStatus.WaitingApproval, postApproval, false);
                    //bst.ChangeState(booking, old);
                    //booking.AddHistory(name, string.Format("Status changed from {0} to {1}", bookingStatus.WaitingApproval.ToString(), booking.Status.ToString()));
                    ctx.SaveChanges();
                }
            }
            StartStandardTasks();
            //BookingMailer bm = new BookingMailer();
            //bm.StartAndForget();
        }
        [HttpPost]
        [Route("cancel/booking/{id}")]
        public void CancelBooking(long id)
        {
            //long abodeId = 1;
            using (var ctx = new BookingDataContext())
            {
                var m = this.GetCurrentMember();
                var name = m.Fullname;
                var booking = ctx.Bookings.Find(id);
                var today = BookingGlobals.GetToday();
                if (booking.Status != bookingStatus.Cancelled)
                {
                    bookingStatus old = booking.Status;
                    booking.AccomodationCollection.Clear();
                    //booking.Status = bookingStatus.Cancelled;
                    //booking.StatusLastChanged = DateTime.Now;
                    //booking.AddHistory(name, string.Format("Status changed from {0} to {1}", old.ToString(), booking.Status.ToString()));
                    //var bst = Factory.GetBookingStateTransition(ctx, abodeId);
                    //bst.ChangeState(booking, old);
                    booking.PerformStateTransition(name, ctx, old, bookingStatus.Cancelled, false);
                    //booking.AddHistory(name, string.Format("Status changed from {0} to {1}", old.ToString(), booking.Status.ToString()));
                    ctx.SaveChanges();
                }
            }
            StartStandardTasks();
            //BookingMailer bm = new BookingMailer();
            //bm.StartAndForget();
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
                if (ec == null)
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
        [HttpPost]
        [Route("create/blockedperiod/{abodeId}")]
        public dynamic CreateBlockedPeriod(long abodeId, dynamic data)
        {
            string from = data.from;
            string to = data.to;
            string remarks = data.remarks;
            using (var ctx = new BookingDataContext())
            {
                DateTime starts = DateTime.Parse(from);
                DateTime ends = DateTime.Parse(to);
                IEnumerable<Availability> blockedItems = GetBlockedItems(ctx);
                var overlapping = blockedItems.ToArray()
                    .Where(bi => bi.Period.GetStartDate() <= ends && starts <= bi.Period.GetEndDate());
                if (overlapping.Count() == 0)
                {
                    bool hasBooking = false;
                    for (DateTime day = starts; day <= ends; day = day.AddDays(1))
                    {
                        DayInformation di = Factory.GetDayInformationInstance(ctx, abodeId, day);
                        if (di.Status != DayStatus.IsFree && di.Status != DayStatus.IsNotBookable)
                        {
                            hasBooking = true;
                            break;
                        }
                    }
                    if (!hasBooking)
                    {
                        Accomodation toplevel = ctx.AccomodationSet.Single(a => a.Type == AccomodationType.Hut);
                        Availability newAvailability = new Availability
                        {
                            Blocked = true,
                            Accomodation = toplevel,
                            Description = remarks,
                            Period = new Period
                            {
                                PeriodType = PeriodType.Fixed,
                                //Name = "Fixed period",
                                //Description = string.Format("Range is from {0} to {1}", from, to),
                                StartDate = starts,
                                EndDate = ends
                            }
                        };
                        ctx.Periods.Add(newAvailability.Period);
                        ctx.Availablities.Add(newAvailability);
                        ctx.SaveChanges();
                        return new { success = true };
                    }
                    else
                    {
                        return new { success = false, error = "This period contains one or more booked days" };
                    }
                }
                else
                {
                    return new { success = false, error = "This period overlaps with an existing blocked period" };
                }
            }
        }
        [HttpPost]
        [Route("delete/blockedperiod/{abodeId}/{availabilityId}")]
        public void DeleteBlockedPeriod(long abodeId, long availabilityId)
        {
            using (var ctx = new BookingDataContext())
            {
                Availability availability = ctx.Availablities.Find(availabilityId);
                if (availability != null)
                {
                    ctx.Periods.Remove(availability.Period);
                    ctx.Availablities.Remove(availability);
                    ctx.SaveChanges();
                }
            }
        }
        [HttpGet]
        [Route("get/blockedperiods/{abodeId}")]
        public bookingAvailability GetBlockedPeriods(long abodeId)
        {
            // Also returns Online Booking open/closed
            using (var ctx = new BookingDataContext())
            {
                //Notes:
                //(a) Availability is also attached to an Accomodation item (so that individual rooms, etc, might be blocked
                //    but this is not implemented as yet and all blocked periods apply to the topmost item in the abode.
                //    This is sufficient for dwh but may not be enough for others (but remember that the booking calendar 
                //    is only capable of showing the day as blocked ...)
                //(b) a blocked period can only be "fixed", i.e. have a defined start and end
                //(c) blocked periods cannot overlap 
                IEnumerable<Availability> blockedItems = GetBlockedItems(ctx);
                var ba = new bookingAvailability();
                ba.bookingOpen = Globals.BookingIsOpen();
                ba.blockedPeriods = new List<blockedPeriod>();
                foreach (var item in blockedItems)
                {
                    var bp = new blockedPeriod();
                    bp.availabilityId = item.AvailabilityId;
                    bp.startsOn = item.Period.GetStartDate();
                    bp.endsOn = item.Period.GetEndDate();
                    bp.remarks = item.Description;
                    ba.blockedPeriods.Add(bp);
                }
                return ba;
            }

        }
        [HttpGet]
        [Route("get/pricing/{abodeId}")]
        public IEnumerable<pricing> GetPricing(long abodeId)
        {
            using (var ctx = new BookingDataContext())
            {
                try
                {
                    var backDate = BookingGlobals.GetToday().AddMonths(-1);
                    var bedPrices = ctx.Prices.Include(x => x.Period).ToArray()
                    .Where(x => x.Type == AccomodationType.Bed && x.Class == AccomodationClass.Standard &&
                         (x.Period.PeriodType == PeriodType.Rolling || x.Period.PeriodType == PeriodType.Fixed && x.Period.EndDate >= backDate))//;
                    .OrderBy(x => x.Period.StartDate);
                    //var temp = bedPrices.ToArray();
                    return bedPrices.ToArray().Select(x => new pricing(x));
                }
                catch (Exception)
                {
                    //Debugger.Break();
                    throw;
                }
            }
        }
        [HttpPost]
        [Route("add/pricing/{abodeId}")]
        public void AddPricing(long abodeId, dynamic data)
        {
            // I only support a limited basic pricing:
            // a) only standard bed pricing is allowed
            // b) all prices belong to default price structure
            // c) the last price period is always rolling and this is the only rolling one
            // d) all previous price periods are fixed
            string from = data.from;
            int amount = data.amount;
            DateTime starts = DateTime.Parse(from);
            using (var ctx = new BookingDataContext())
            {
                var lastPrice = ctx.Prices.Single(x => x.Period.PeriodType == PeriodType.Rolling);
                DateTime rollsFrom = lastPrice.Period.GetStartDate();
                if (starts == rollsFrom)
                {
                    // replace the amount
                    lastPrice.Amount = amount;
                }
                else if (starts > rollsFrom)
                {
                    // make this the new last price
                    DateTime ends = starts.AddDays(-1);
                    lastPrice.Period.PeriodType = PeriodType.Fixed;
                    lastPrice.Period.EndDate = ends;
                    Period np = new Period
                    {
                        StartDate = starts,
                        PeriodType = PeriodType.Rolling,
                        EndDate = null
                    };
                    Price newPrice = new Price
                    {
                        Amount = amount,
                        Capacity = 1,
                        Class = AccomodationClass.Standard,
                        Type = AccomodationType.Bed,
                        Period = np
                    };
                    ctx.Periods.Add(np);
                    ctx.Prices.Add(newPrice);
                }
                else
                {
                    var prices = ctx.Prices.OrderBy(x => x.Period.StartDate.Value).ToList();
                    if (prices.Any(p => p.Period.StartDate.Value == starts))
                    {
                        var mp = prices.First(p => p.Period.StartDate.Value == starts);
                        mp.Amount = amount;
                    }
                    else
                    {
                        var flp = prices.SkipWhile(p => p.Period.StartDate.Value < starts).First();

                        Price newPrice = new Price
                        {
                            Amount = amount,
                            Capacity = 1,
                            Class = AccomodationClass.Standard,
                            Type = AccomodationType.Bed,
                            Period = new Period
                            {
                                StartDate = starts,
                                PeriodType = PeriodType.Fixed,
                                EndDate = flp.Period.StartDate.Value.AddDays(-1)
                            }
                        };
                        ctx.Periods.Add(newPrice.Period);
                        ctx.Prices.Add(newPrice);
                        var index = prices.IndexOf(flp);
                        if (index != 0)
                        {
                            var pp = prices[index - 1];
                            pp.Period.EndDate = starts.AddDays(-1);
                        }
                    }
                }
                ctx.SaveChanges();
            }
        }
        [HttpPost]
        [Route("remove/pricing/{abodeId}/{id}")]
        public void RemovePricing(long abodeId, long id)
        {
            using (var ctx = new BookingDataContext())
            {
                var prices = ctx.Prices.OrderBy(x => x.Period.StartDate.Value).ToList();
                if (prices.Count() > 1)
                {
                    var priceToDelete = ctx.Prices.Find(id);
                    var index = prices.IndexOf(priceToDelete);
                    if (index == 0)
                    {
                        // first one
                        var np = prices[1];
                        np.Period.StartDate = priceToDelete.Period.StartDate;
                    }
                    else if (index == prices.Count() - 1)
                    {
                        // last one
                        var pp = prices[index - 1];
                        pp.Period.PeriodType = PeriodType.Rolling;
                        pp.Period.EndDate = null;
                        //pp.Period.Description = string.Format("Range is from {0} onwards", pp.Period.StartDate.Value.ToDefault());
                        //pp.Period.Name = "Rolling Period";
                    }
                    else
                    {
                        var np2 = prices[index - 1];
                        np2.Period.EndDate = priceToDelete.Period.EndDate;
                    }
                    ctx.Periods.Remove(priceToDelete.Period);
                    ctx.Prices.Remove(priceToDelete);
                    ctx.SaveChanges();
                }
            }
        }
        [HttpPost]
        [Route("onlinebooking/set/{open}")]
        public void SetOnlineBooking(bool open)
        {
            BookingSettings.Set(BookingSettingKeys.OnlineBookingClosed, !open);
            DataContext.SaveChanges();
        }
        [HttpGet]
        [Route("get/emailtemplatelist")]
        public IEnumerable<string> GetEmailTemplateList()
        {
            return Enum.GetNames(typeof(BookingEmailTemplates)).OrderBy(x => x);
        }
        [HttpGet]
        [Route("get/emailtemplate/{template}")]
        public dynamic GetEmailTemplate(string template)
        {
            using (var ctx = new BookingDataContext())
            {
                BookingEmailTemplates t = (BookingEmailTemplates)Enum.Parse(typeof(BookingEmailTemplates), template);
                string subjectText;
                string bodyText;
                ctx.GetEmailTemplates(t, out subjectText, out bodyText);
                return new { subjectText = subjectText, bodyText = bodyText };
            }
        }
        [HttpPost]
        [Route("update/emailtemplate")]
        public void UpdateEmailtemplate(dynamic data)
        {
            string template = data.template;
            string subjectText = data.subjectText;
            string bodyText = data.bodyText;
            using (var ctx = new BookingDataContext())
            {
                BookingEmailTemplates t = (BookingEmailTemplates)Enum.Parse(typeof(BookingEmailTemplates), template);
                ctx.SaveEmailTemplate(t, subjectText, bodyText);
                ctx.SaveChanges();
                EmailHelper.ClearEmailTemplateCache();
            }
        }            
        private static IEnumerable<Availability> GetBlockedItems(BookingDataContext ctx)
        {
            DateTime today = BookingGlobals.GetToday();
            var blockedItems = ctx.Availablities.ToArray().Where(x => x.Blocked && x.Period.PeriodType == PeriodType.Fixed && (x.Period.GetStartDate() >= today || x.Period.Includes(today)));
            return blockedItems;
        }
        private void StartStandardTasks()
        {
            TaskBase finalreminders = Factory.GetRemindersTask(true);
            finalreminders.StartAndForget();
            TaskBase reminders = Factory.GetRemindersTask();
            reminders.StartAndForget();
            BookingMailer bm = new BookingMailer();
            bm.StartAndForget();
            EntryNotificationTask ent = new EntryNotificationTask();
            ent.StartAndForget();
        }
    }
}
