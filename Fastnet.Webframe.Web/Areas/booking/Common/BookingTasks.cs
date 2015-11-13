using Fastnet.Common;
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
                        try
                        {

                            SendMailObject smo = new SendMailObject(mail.EmailAddress, mail.Subject, mail.Body, mail.Template.ToString());
                            MailSender ms = new MailSender(smo);
                            await ms.Start();
                            mail.Status = BookingEmailStatus.Sent;
                        }
                        catch (Exception xe)
                        {
                            // mail sending failed
                            mail.FailureDescription = xe.Message;
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
}