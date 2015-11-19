﻿using Fastnet.Common;
using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.Web.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Web;


namespace Fastnet.Webframe.Web.Areas.booking
{
    public class TestTask : TaskBase
    {
        const string taskId = "1AD55761-A14D-4C9A-BD32-5CC38926F42C";
        public TestTask() : base(taskId)
        {

        }
        private void Write(BookingDataContext ctx)
        {
            string fmt = "Test task execute(): {1}, thread {0}";
            string message = string.Format(fmt, Thread.CurrentThread.ManagedThreadId, DateTime.Now.ToString("ddMMMyyyy HH:mm:ss"));
            Tasklog tl = new Tasklog { Message = message };
            ctx.Tasklogs.Add(tl);
            ctx.SaveChanges();
        }

        protected override async Task<WebtaskResult> Execute()
        {
            var wtr = new WebtaskResult();
            int count = 20 * 6;
            while (count-- > 0)
            {
                using (var ctx = new BookingDataContext())
                {
                    Write(ctx);
                }
                await Task.Delay(TimeSpan.FromSeconds(10));
            }
            return wtr;
        }
    }
    public class BookingMailer : TaskBase
    {
        const string taskId = "ED56FE82-C7F5-47BF-B7A7-AE0B70509298";
        public BookingMailer() : base(taskId)
        {

        }
        protected override async Task<WebtaskResult> Execute()
        {
            WebtaskResult wtr = new WebtaskResult();
            IEnumerable<long> pendingMailIds = null;
            using (var ctx = new BookingDataContext())
            {
                pendingMailIds = ctx.CollectPendingMail().Select(x => x.BookingEmailId).ToArray();
            }
            foreach (long mailId in pendingMailIds)
            {
                using (var ctx = new BookingDataContext())
                {
                    var tran = ctx.Database.BeginTransaction();
                    var mail = ctx.Emails.Find(mailId);
                    if (mail.Status == BookingEmailStatus.NotSent || mail.Status == BookingEmailStatus.FailedRetryable)
                    {
                        mail.Status = BookingEmailStatus.Sending;
                    }
                    ctx.SaveChanges();
                    tran.Commit();
                    if (mail.Status == BookingEmailStatus.Sending)
                    {
                        Booking booking = mail.Booking;
                        try
                        {

                            SendMailObject smo = new SendMailObject(mail.EmailAddress, mail.Subject, mail.Body, mail.Template.ToString());
                            MailSender ms = new MailSender(smo);
                            await ms.Start();
                            mail.Status = BookingEmailStatus.Sent;
                            mail.UtcSentAt = DateTime.UtcNow;
                            booking.AddHistory("System", string.Format("Email (using the {0} template) sent to {1}", mail.Template.ToString(), mail.EmailAddress));
                        }
                        catch (Exception xe)
                        {
                            // mail sending failed
                            mail.FailureDescription = xe.Message;
                            mail.UtcSentAt = null;
                            booking.AddHistory("System", string.Format("Email (using the {0} template) to {1} failed: {2}", mail.Template.ToString(), mail.EmailAddress, mail.FailureDescription));
                            if (mail.RetryCountToDate > ApplicationSettings.Key("Booking:MailRetryCount", 3))
                            {
                                mail.Status = BookingEmailStatus.Failed;
                            }
                            else
                            {
                                mail.RetryCountToDate++;
                                mail.Status = BookingEmailStatus.FailedRetryable;
                            }
                        }
                        ctx.SaveChanges();
                    }
                }
            }
            return wtr;
        }
    }
    public class EntryNotificationTask : TaskBase
    {
        const string taskId = "861F6C8F-6D7B-42DE-8934-F643B5F67BC5";
        public EntryNotificationTask(): base(taskId)
        {

        }

        protected override async Task<WebtaskResult> Execute()
        {
            WebtaskResult wtr = new WebtaskResult();
            int shortBookingInterval = 0;
            int entryCodeNotificationPeriod = 0;
            int entryCodeBridgePeriod = 0;
            string abodeName = "";
            using (var ctx = new CoreDataContext())
            {
                var pars = Factory.GetBookingParameters() as dwhBookingParameters;
                pars.Load(ctx);
                shortBookingInterval = pars.shortBookingInterval;
                entryCodeNotificationPeriod = pars.entryCodeNotificationPeriod;
                entryCodeBridgePeriod = pars.entryCodeBridgePeriod;
                abodeName = pars.currentAbode.name;
            }
            //string abodeName = ctx.AccomodationSet.Find(abodeId).DisplayName;
            var bookingSecretaryEmailAddress = Globals.GetBookingSecretaryEmailAddress();
            var today = BookingGlobals.GetToday();
            var notificationDate = today.AddDays(entryCodeNotificationPeriod); // parameterize 7
            using (var ctx = new BookingDataContext())
            {
                var tran = ctx.Database.BeginTransaction();
                DateTime utcDueAt = DateTime.UtcNow;
                var bookingsStartingSoon = ctx.Bookings
                    .Where(x => x.Status == bookingStatus.Confirmed && x.From >= today && x.From <= notificationDate).ToArray();
                var notifiableBookings = bookingsStartingSoon.Where(x => x.Emails.Any(z => z.Template == BookingEmailTemplates.EntryCodeNotification) == false);
                foreach (var booking in notifiableBookings)
                {
                    AquireEntryCode(ctx, booking, entryCodeBridgePeriod);
                    booking b = Factory.GetBooking(booking);
                    EmailHelper.QueueEmail(ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.EntryCodeNotification, b.memberEmailAddress, b);
                }
                await ctx.SaveChangesAsync();
                tran.Commit();
            }
            return wtr;
        }

        private void AquireEntryCode(BookingDataContext ctx, Booking booking, int entryCodeBridgePeriod)
        {
            string entryCode = "";
            DateTime first = booking.From;
            DateTime last = booking.To;
            var firstCode = ctx.EntryCodes.Where(x => x.ApplicableFrom <= first).OrderBy(x => x.ApplicableFrom).ToArray().LastOrDefault();
            if (firstCode != null)
            {
                var previousCode = ctx.EntryCodes.Where(x => x.ApplicableFrom < firstCode.ApplicableFrom).OrderBy(x => x.ApplicableFrom).ToArray().LastOrDefault();
                string text = firstCode.Code;
                if (previousCode != null)
                {
                    int bridgePeriod = entryCodeBridgePeriod;// parameterize 7 ?
                    if (first <= firstCode.ApplicableFrom.AddDays(bridgePeriod))
                    {
                        text += " or " + previousCode.Code;
                    }
                }
                entryCode = text;
            }
            else
            {
                entryCode = "(no entry code found!)";
            }
            booking.EntryInformation = entryCode;
        }
    }
    public class DWHReminders : TaskBase
    {
        const string taskId = "11F52FFB-3670-4107-86A0-C5E65455AB1E";
        //private bool final;
        public DWHReminders() : base(taskId)
        {

        }
        protected override  async Task<WebtaskResult> Execute()
        {
            WebtaskResult wtr = new WebtaskResult();
            int shortBookingInterval = 0;
            string abodeName = "";
            using (var ctx = new CoreDataContext())
            {
                var pars = Factory.GetBookingParameters() as dwhBookingParameters;
                pars.Load(ctx);
                shortBookingInterval = pars.shortBookingInterval;
                abodeName = pars.currentAbode.name;
            }
            //string abodeName = ctx.AccomodationSet.Find(abodeId).DisplayName;
            var bookingSecretaryEmailAddress = Globals.GetBookingSecretaryEmailAddress();
            var today = BookingGlobals.GetToday();
            var NDays = today.AddDays(shortBookingInterval);
            var NDaysLess7 = NDays.AddDays(-7);
            using (var ctx = new BookingDataContext())
            {
                var tran = ctx.Database.BeginTransaction();
                DateTime utcDueAt = DateTime.UtcNow;
                var nearBookings = ctx.Bookings.Where(x => x.Status == bookingStatus.WaitingPayment && x.From >= today && x.From <= NDays).ToArray();
                var reminderSet = nearBookings.Where(x => x.Emails.Any(z => z.Template == BookingEmailTemplates.Reminder) == false && x.Emails.Any(z => z.Template == BookingEmailTemplates.FinalReminder) == false);
                foreach (var booking in reminderSet)
                {
                    booking b = Factory.GetBooking(booking);
                    EmailHelper.QueueEmail(ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.Reminder, b.memberEmailAddress, b);
                }

                await ctx.SaveChangesAsync();
                tran.Commit();
            }
            return wtr;
        }
    }
    public class DWHFinalReminders : TaskBase
    {
        const string taskId = "DDF8F690-26DD-4DD5-A567-5502C596653B";
        public DWHFinalReminders(): base(taskId)
        {

        }

        protected override async Task<WebtaskResult> Execute()
        {
            WebtaskResult wtr = new WebtaskResult();
            int shortBookingInterval = 0;
            string abodeName = "";
            using (var ctx = new CoreDataContext())
            {
                var pars = Factory.GetBookingParameters() as dwhBookingParameters;
                pars.Load(ctx);
                shortBookingInterval = pars.shortBookingInterval;
                abodeName = pars.currentAbode.name;
            }
            //string abodeName = ctx.AccomodationSet.Find(abodeId).DisplayName;
            var bookingSecretaryEmailAddress = Globals.GetBookingSecretaryEmailAddress();
            var today = BookingGlobals.GetToday();
            var NDays = today.AddDays(shortBookingInterval);
            var NDaysLess7 = NDays.AddDays(-7);
            using (var ctx = new BookingDataContext())
            {
                var tran = ctx.Database.BeginTransaction();
                DateTime utcDueAt = DateTime.UtcNow;
                var nearBookings = ctx.Bookings.Where(x => x.Status == bookingStatus.WaitingPayment && x.From >= today && x.From <= NDays).ToArray();
                var finalSet = nearBookings.Where(x => x.From <= NDaysLess7 && x.Emails.Any(z => z.Template == BookingEmailTemplates.FinalReminder) == false);
                foreach (var booking in finalSet)
                {
                    booking b = Factory.GetBooking(booking);
                    EmailHelper.QueueEmail(ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.FinalReminder, b.memberEmailAddress, b);
                }

                await ctx.SaveChangesAsync();
                tran.Commit();
            }
            return wtr;
        }
    }
}