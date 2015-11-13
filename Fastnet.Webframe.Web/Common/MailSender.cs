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
            MailMessage mail = new MailMessage("noreply@webframe.co.uk", destination, subject, body);
            mail.IsBodyHtml = true;
            MailMessage = mail;
            Template = templateName;
        }
    }
    public class MailSender : TaskBase
    {
        const string taskId = "06862096-D2D6-4A00-93A0-5E46226F01A6";
        private SendMailObject smo;
        public MailSender(SendMailObject smo) : base(taskId)
        {
            this.smo = smo;
        }

        protected override async Task<WebtaskResult> Execute()
        {
            WebtaskResult wtr = new WebtaskResult { User = smo };
            bool mailEnabled = ApplicationSettings.Key("MailEnabled", true);
            if (mailEnabled)
            {
                try
                {
                    SmtpClient client = new SmtpClient();
                    await client.SendMailAsync(smo.MailMessage);                  
                    RecordMail(smo);
                }
                catch (Exception xe)
                {
                    wtr.HasFailed = true;
                    wtr.Exception = xe;                  
                    RecordMailException(smo, xe);
                }
            }
            else
            {
                RecordMail(smo, true);
            }
            return wtr;
        }
        private void RecordMailException(SendMailObject smo, Exception mailError)
        {
            using (var dctx = new CoreDataContext())
            {
                MailAction ma = GetBaseRecord(smo);
                if (mailError is SmtpFailedRecipientException)
                {
                    SmtpFailedRecipientException fre = mailError as SmtpFailedRecipientException;
                    SmtpStatusCode status = fre.StatusCode;
                    if (status == SmtpStatusCode.MailboxBusy ||
                        status == SmtpStatusCode.MailboxUnavailable)
                    {
                        ma.Failure = string.Format("Mailbox busy or unavailable, mail delayed");
                    }
                    else // delivery failed
                    {
                        ma.Failure = string.Format("Delivery failed - status {0}", status.ToString());
                    }
                }
                else if (mailError is SmtpFailedRecipientsException)
                {
                    Log.Write(EventSeverities.Error, "MailSender does not handle multiple failed recipients");
                    ma.Failure = string.Format("Delivery failed - {0}", mailError.Message);
                }
                else
                {
                    Log.Write("RecordMailException: {0} - how should this be handled?", mailError.Message);
                    ma.Failure = string.Format("Delivery failed - {0}", mailError.Message);
                }
                dctx.Actions.Add(ma);
                dctx.SaveChanges();
            }
        }
        private void RecordMail(SendMailObject smo, bool mailDisabled = false)
        {
            using (var dctx = new CoreDataContext())
            {

                MailMessage mail = smo.MailMessage;
                string templateName = smo.Template;
                MailAction ma = GetBaseRecord(smo);
                ma.MailDisabled = mailDisabled;

                dctx.Actions.Add(ma);
                dctx.SaveChanges();
            }
        }
        private MailAction GetBaseRecord(SendMailObject smo)
        {
            MailAction ma = new MailAction
            {
                Subject = smo.MailMessage.Subject,
                To = smo.Redirected ? smo.OriginalAddress : smo.MailMessage.To.First().Address,
                From = smo.MailMessage.From.Address,
                MailTemplate = smo.Template,
                MailBody = smo.MailMessage.Body,
                Redirected = smo.Redirected,
                RedirectedTo = smo.Redirected ? smo.MailMessage.To.First().Address : ""
            };
            return ma;
        }
    }
}