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
    public class MailSender
    {
        private SendMailObject smo;
        public MailSender(SendMailObject smo)
        {
            this.smo = smo;
        }
        public async Task<Exception> SendMailAsync(CoreDataContext ctx)
        {
            try
            {
                Exception result = null;
                var redirectTo = ApplicationSettings.Key<string>("RedirectMailTo", null);
                if (redirectTo != null)
                {
                    smo.OriginalAddress = smo.MailMessage.To.First().Address;
                    smo.MailMessage.To.Clear();
                    smo.MailMessage.To.Add(new MailAddress(redirectTo));
                    smo.Redirected = true;
                }
                bool mailEnabled = ApplicationSettings.Key("MailEnabled", false);
                if (mailEnabled)
                {
                    try
                    {
                        SmtpClient client = new SmtpClient();
                        smo.MailMessage.Sender = new MailAddress(ApplicationSettings.Key("MailSender", "noreply@sitemail.webframe.co.uk"));

                        await client.SendMailAsync(smo.MailMessage);
                        RecordMail(ctx, smo);
                    }
                    catch (Exception xe)
                    {
                        RecordMailException(ctx, smo, xe);
                        result = xe;
                    }
                }
                else
                {
                    RecordMail(ctx, smo, true);
                }
                return result;
            }
            catch (Exception xe)
            {
                Log.Write(xe);
                throw;
            }
        }
        private void RecordMailException(CoreDataContext dctx, SendMailObject smo, Exception mailError)
        {
            //using (var dctx = new CoreDataContext())
            //{

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
                Log.Write(EventSeverities.Error, $"Mail to {smo.MailMessage.To.First().Address} failed: {ma.Failure}");
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
            //}
        }
        private void RecordMail(CoreDataContext dctx, SendMailObject smo, bool mailDisabled = false)
        {
            //using (var dctx = new CoreDataContext())
            //{

            MailMessage mail = smo.MailMessage;
            string templateName = smo.Template;
            MailAction ma = GetBaseRecord(smo);
            ma.MailDisabled = mailDisabled;
            ma.Remark = smo.Remark;
            dctx.Actions.Add(ma);
            dctx.SaveChanges();
            Log.Write($"Mail sent to {mail.To.First().Address}: Subject \"{mail.Subject}\", using template {templateName}, mail is {(mailDisabled ? "disabled" : "enabled") }");
            //}
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