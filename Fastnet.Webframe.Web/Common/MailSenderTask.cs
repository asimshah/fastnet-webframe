using Fastnet.Common;
using Fastnet.EventSystem;
using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
using System.Threading.Tasks;
using System.Web;

namespace Fastnet.Webframe.Web.Common
{
    public class SendMailObject
    {
        public MailMessage MailMessage { get; set; }
        public string Template { get; set; }
        public bool Redirected { get; set; }
        public string OriginalAddress { get; set; }
        public int RetryCount { get; set; }
        public string Remark { get; set; }
        public SendMailObject()
        {

        }
        public SendMailObject(MailMessage mailmessage, string templateName)
        {
            MailMessage = mailmessage;
            Template = templateName;
        }
        public SendMailObject(string destination, string subject, string body, string templateName)
        {
            string from = ApplicationSettings.Key("MailSender", "noreply@sitemail.webframe.co.uk");
            MailMessage mail = new MailMessage(from, destination, subject, body);
            mail.IsBodyHtml = true;
            MailMessage = mail;
            Template = templateName;
        }
    }
    public class MailSenderTask : TaskBase
    {
        const string taskId = "06862096-D2D6-4A00-93A0-5E46226F01A6";
        private SendMailObject smo;
        public MailSenderTask(SendMailObject smo) : base(taskId)
        {
            this.smo = smo;
        }

        protected override async Task<WebtaskResult> Execute()
        {
            WebtaskResult wtr = new WebtaskResult { User = smo };
            var ms = new MailSender(smo);
            using (var ctx = new CoreDataContext())
            {
                Exception r = await ms.SendMailAsync(ctx);
                if (r != null)
                {
                    wtr.HasFailed = true;
                    wtr.Exception = r;
                }
            }
            return wtr;
        }
        //private void RecordMailException(SendMailObject smo, Exception mailError)
        //{
        //    using (var dctx = new CoreDataContext())
        //    {
        //        MailAction ma = GetBaseRecord(smo);
        //        if (mailError is SmtpFailedRecipientException)
        //        {
        //            SmtpFailedRecipientException fre = mailError as SmtpFailedRecipientException;
        //            SmtpStatusCode status = fre.StatusCode;
        //            if (status == SmtpStatusCode.MailboxBusy ||
        //                status == SmtpStatusCode.MailboxUnavailable)
        //            {
        //                ma.Failure = string.Format("Mailbox busy or unavailable, mail delayed");
        //            }
        //            else // delivery failed
        //            {
        //                ma.Failure = string.Format("Delivery failed - status {0}", status.ToString());
        //            }
        //            Log.Write(EventSeverities.Error, $"Mail to {smo.MailMessage.To.First().Address} failed: {ma.Failure}");
        //        }
        //        else if (mailError is SmtpFailedRecipientsException)
        //        {
        //            Log.Write(EventSeverities.Error, "MailSender does not handle multiple failed recipients");
        //            ma.Failure = string.Format("Delivery failed - {0}", mailError.Message);
        //        }
        //        else
        //        {
        //            Log.Write("RecordMailException: {0} - how should this be handled?", mailError.Message);
        //            ma.Failure = string.Format("Delivery failed - {0}", mailError.Message);
        //        }
        //        dctx.Actions.Add(ma);
        //        dctx.SaveChanges();
        //    }
        //}
        //private void RecordMail(SendMailObject smo, bool mailDisabled = false)
        //{
        //    using (var dctx = new CoreDataContext())
        //    {
        //        MailMessage mail = smo.MailMessage;
        //        string templateName = smo.Template;
        //        MailAction ma = GetBaseRecord(smo);
        //        ma.MailDisabled = mailDisabled;
        //        ma.Remark = smo.Remark;
        //        dctx.Actions.Add(ma);
        //        dctx.SaveChanges();
        //        Log.Write($"Mail sent to {mail.To.First().Address}: Subject {mail.Subject}, using template {templateName}, mail is {(mailDisabled ? "disabled" : "enabled") }");
        //    }
        //}
        //private MailAction GetBaseRecord(SendMailObject smo)
        //{
        //    MailAction ma = new MailAction
        //    {
        //        Subject = smo.MailMessage.Subject,
        //        To = smo.Redirected ? smo.OriginalAddress : smo.MailMessage.To.First().Address,
        //        From = smo.MailMessage.From.Address,
        //        MailTemplate = smo.Template,
        //        MailBody = smo.MailMessage.Body,
        //        Redirected = smo.Redirected,
        //        RedirectedTo = smo.Redirected ? smo.MailMessage.To.First().Address : ""
        //    };
        //    return ma;
        //}
    }
}