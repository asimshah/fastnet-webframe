using Fastnet.Common;
using Fastnet.EventSystem;
using Fastnet.Web.Common;
using Fastnet.Webframe.CoreData;
using System;
using System.Configuration;
using System.Diagnostics;
using System.Linq;
using System.Net.Configuration;
using System.Net.Mail;
using System.Threading.Tasks;
using System.Web;


namespace Fastnet.Webframe.Web.Common
{
    public class MailHelper
    {
        public void SendAccountActivationAsync(CoreDataContext ctx, string destination, string UrlScheme, string UrlAuthority, string userId, string activationCode)
        {
            string siteUrl = GetSiteUrl(UrlScheme, UrlAuthority);// string.Format("{0}://{1}", UrlScheme, UrlAuthority);
            string subject = string.Format("Welcome to {0}", siteUrl);
            string callbackUrl = string.Format("{0}/activate/{1}/{2}", siteUrl, userId, activationCode);
            var tl = TemplateLibrary.GetInstance();
            string text = tl.GetTemplate("main-emails", "AccountActivation");
            string body = string.Format(text, siteUrl, callbackUrl, Globals.AdminEmailAddress);
            Log.Write($"Account activation email prepared for {destination}");
            SendAndForget(ctx, new SendMailObject(destination, subject, body, "AccountActivation"));
        }
        public void SendPasswordResetAsync(CoreDataContext ctx, string destination, string UrlScheme, string UrlAuthority, string userId, string code)
        {
            string siteUrl = GetSiteUrl(UrlScheme, UrlAuthority);// string.Format("{0}://{1}", UrlScheme, UrlAuthority);
            string subject = string.Format("Password Reset for {0}", siteUrl);
            string callbackUrl = string.Format("{0}/passwordreset/{1}/{2}", siteUrl, userId, code);
            var tl = TemplateLibrary.GetInstance();
            string text = tl.GetTemplate("main-emails", "PasswordReset");
            string body = string.Format(text, siteUrl, callbackUrl, Globals.AdminEmailAddress);
            Log.Write($"PasswordReset email prepared for {destination}");
            SendAndForget(ctx, new SendMailObject(destination, subject, body, "PasswordReset"));
        }
        public void SendEmailAddressChangedAsync(CoreDataContext ctx, string destination, string UrlScheme, string UrlAuthority, string userId, string activationCode)
        {
            string siteUrl = GetSiteUrl(UrlScheme, UrlAuthority);// string.Format("{0}://{1}", UrlScheme, UrlAuthority);
            string subject = string.Format("New email address for {0}", siteUrl);
            string callbackUrl = string.Format("{0}/activate/{1}/{2}", siteUrl, userId, activationCode);
            var tl = TemplateLibrary.GetInstance();
            string text = tl.GetTemplate("main-emails", "EmailAddressChanged");
            string body = string.Format(text, siteUrl, callbackUrl, Globals.AdminEmailAddress);
            Log.Write($"EmailAddressChanged email prepared for {destination}");
            SendAndForget(ctx, new SendMailObject(destination, subject, body, "EmailAddressChanged"));
        }
        public void SendTestMailAsync(CoreDataContext ctx, string destination, string subject, string body)
        {
            Log.Write($"TestMail email prepared for {destination}");
            SendAndForget(ctx, new SendMailObject(destination, subject, body, "TestMail"));
        }
        private void SendAndForget(CoreDataContext ctx, SendMailObject smo)
        {
            Task.Run(async () => {
                try
                {
                    var dctx = new CoreDataContext();
                    var ms = new MailSender(smo);
                    var exception = await ms.SendMailAsync(dctx);
                    if (exception != null)
                    {
                        Log.Write(exception);
                    }
                }
                catch (Exception xe)
                {
                    Log.Write(xe);
                }
            });
        }
        private string GetSiteUrl(string UrlScheme, string UrlAuthority)
        {
            return string.Format("{0}://{1}", UrlScheme, UrlAuthority);
        }
    }
    //public class MailHelper : IDisposable
    //{
    //    //private static HttpContext httpCtx;
    //    //private CoreDataContext DataContext;// = Core.GetDataContext();
    //    //public static bool sendInProgress
    //    //{
    //    //    get
    //    //    {
    //    //        var app = httpCtx.Application;
    //    //        return (bool)app["sending-email"];
    //    //    }
    //    //    set
    //    //    {
    //    //        var app = httpCtx.Application;
    //    //        app["sending-email"] = value;
    //    //    }
    //    //}
    //    //static MailHelper()
    //    //{
    //    //    httpCtx = HttpContext.Current;
    //    //    var app = httpCtx.Application;
    //    //    if (app["sending-email"] == null)
    //    //    {
    //    //        app["sending-email"] = false;
    //    //        Debug.Print("app[\"sending-email\"] initialised");
    //    //    }
    //    //}
    //    //public MailHelper()
    //    //{
    //    //    try
    //    //    {
    //    //        DataContext = new CoreDataContext();
    //    //    }
    //    //    catch (Exception xe)
    //    //    {

    //    //        throw;
    //    //    }
    //    //}
    //    //public async Task SendPasswordResetAsync(string destination, string UrlScheme, string UrlAuthority, string userId, string code)
    //    //{
    //    //    string siteUrl = GetSiteUrl(UrlScheme, UrlAuthority);// string.Format("{0}://{1}", UrlScheme, UrlAuthority);
    //    //    string subject = string.Format("Password Reset for {0}", siteUrl);
    //    //    string callbackUrl = string.Format("{0}/passwordreset/{1}/{2}", siteUrl, userId, code);
    //    //    var tl = TemplateLibrary.GetInstance();
    //    //    string text = tl.GetTemplate("main-emails", "PasswordReset");
    //    //    string body = string.Format(text, siteUrl, callbackUrl, Globals.AdminEmailAddress);
    //    //    await SendMailAsync(destination, subject, body, "PasswordReset");
    //    //}
    //    //public async Task SendEmailAddressChangedAsync(string destination, string UrlScheme, string UrlAuthority, string userId, string activationCode)
    //    //{
    //    //    string siteUrl = GetSiteUrl(UrlScheme, UrlAuthority);// string.Format("{0}://{1}", UrlScheme, UrlAuthority);
    //    //    string subject = string.Format("New email address for {0}", siteUrl);
    //    //    string callbackUrl = string.Format("{0}/activate/{1}/{2}", siteUrl, userId, activationCode);
    //    //    var tl = TemplateLibrary.GetInstance();
    //    //    string text = tl.GetTemplate("main-emails", "EmailAddressChanged");
    //    //    string body = string.Format(text, siteUrl, callbackUrl, Globals.AdminEmailAddress);
    //    //    await SendMailAsync(destination, subject, body, "EmailAddressChanged");

    //    //}
    //    //public async Task SendAccountActivationAsync(string destination, string UrlScheme, string UrlAuthority, string userId, string activationCode)
    //    //{
    //    //    string siteUrl = GetSiteUrl(UrlScheme, UrlAuthority);// string.Format("{0}://{1}", UrlScheme, UrlAuthority);
    //    //    string subject = string.Format("Welcome to {0}", siteUrl);
    //    //    string callbackUrl = string.Format("{0}/activate/{1}/{2}", siteUrl, userId, activationCode);
    //    //    var tl = TemplateLibrary.GetInstance();
    //    //    string text = tl.GetTemplate("main-emails", "AccountActivation");
    //    //    //string text = EmailTemplate.AccountActivation.GetTemplate();

    //    //    string body = string.Format(text, siteUrl, callbackUrl, Globals.AdminEmailAddress);
    //    //    await SendMailAsync(destination, subject, body, "AccountActivation");

    //    //}
    //    //private async Task SendMailAsync(string destination, string subject, string body)
    //    //{
    //    //    await SendMailAsync(destination, subject, body, null);
    //    //}

    //    //public async Task SendMailAsync(string destination, string subject, string body, string templateName)
    //    //{
    //    //    MailMessage mail = new MailMessage("noreply@webframe.co.uk", destination, subject, body);
    //    //    mail.IsBodyHtml = true;
    //    //    SendMailObject smo = new SendMailObject { MailMessage = mail, Template = templateName };
    //    //    PostprocessAddresses(smo);
    //    //    //dynamic redirectionResult = PostprocessAddresses(mail);
    //    //    // detach send task to another thread
    //    //    await Task.Run(async () =>
    //    //    {
    //    //        await SendMailAsync(smo);
    //    //    });

    //    //    //RecordMail(mail, templateName, redirectionResult);
    //    //}
    //    //private async Task SendMailAsync(SendMailObject smo)
    //    ////private async Task SendMailAsync(MailMessage mail, string templateName, dynamic redirectionResult)
    //    //{
    //    //    bool mailEnabled = ApplicationSettings.Key("MailEnabled", true);
    //    //    if (mailEnabled)
    //    //    {
    //    //        while (sendInProgress)
    //    //        {
    //    //            Log.Write("Waiting to send email ...");
    //    //            await Task.Delay(1000);
    //    //        }
    //    //        try
    //    //        {
    //    //            SmtpClient client = new SmtpClient();// new SmtpClient(smtpHost);
    //    //            client.SendCompleted += (s, e) =>
    //    //            {
    //    //                SendMailObject mo = e.UserState as SendMailObject;
    //    //                sendInProgress = false;
    //    //                if (e.Cancelled)
    //    //                {
    //    //                    Log.Write("SendMailAsync: mail cancelled - how?");
    //    //                }
    //    //                if (e.Error != null)
    //    //                {
    //    //                    RecordMailException(mo, e.Error);
    //    //                    throw e.Error;
    //    //                }
    //    //                else
    //    //                {
    //    //                    RecordMail(smo);
    //    //                }

    //    //            };
    //    //            sendInProgress = true;
    //    //            client.SendAsync(smo.MailMessage, smo);

    //    //        }
    //    //        catch (Exception xe)
    //    //        {
    //    //            RecordMailException(smo, xe);
    //    //            sendInProgress = false;
    //    //            throw xe;
    //    //        }
    //    //    }
    //    //    else
    //    //    {
    //    //        RecordMail(smo, true);
    //    //    }
    //    //    //LogMail(mail, mailEnabled, isRedirected);
    //    //}
    //    //private void RecordMailException(SendMailObject smo, Exception mailError)
    //    //{
    //    //    Log.Write(mailError); // temporary?
    //    //    Action<SmtpFailedRecipientException> handleFailedRecipient = (fre) =>
    //    //    {
    //    //        SmtpStatusCode status = fre.StatusCode;
    //    //        if (status == SmtpStatusCode.MailboxBusy ||
    //    //            status == SmtpStatusCode.MailboxUnavailable)
    //    //        {
    //    //            if (smo.RetryCount == 0)
    //    //            {
    //    //                //var ctx = Core.GetDataContext();
    //    //                MailAction ma = GetBaseRecord(smo);
    //    //                ma.To = fre.FailedRecipient;
    //    //                ma.Failure = string.Format("Mailbox busy or unavailable, mail delayed");
    //    //                DataContext.Actions.Add(ma);
    //    //                DataContext.SaveChanges();
    //    //            }
    //    //            smo.RetryCount++;
    //    //            if (smo.RetryCount < ApplicationSettings.Key("MailNonDeliveryRetryMax", 5))
    //    //            {
    //    //                Task.Run(async () =>
    //    //                {
    //    //                    Log.Write("Delivery to: {0} failed (mailbox busy or unavailable), retry in 15 minutes", smo.MailMessage.To.First().Address);
    //    //                    await Task.Delay(TimeSpan.FromMinutes(15));
    //    //                    await SendMailAsync(smo);
    //    //                });
    //    //            }
    //    //            else
    //    //            {
    //    //                //var ctx = Core.GetDataContext();
    //    //                MailAction ma = GetBaseRecord(smo);
    //    //                ma.To = fre.FailedRecipient;
    //    //                ma.Failure = string.Format("Delivery failed after {0} retries - mail cancelled", smo.RetryCount);
    //    //                DataContext.Actions.Add(ma);
    //    //                DataContext.SaveChanges();
    //    //            }
    //    //            //System.Threading.Thread.Sleep(5000);
    //    //            //client.Send(message);
    //    //        }
    //    //        else
    //    //        {
    //    //            //var ctx = Core.GetDataContext();
    //    //            MailAction ma = GetBaseRecord(smo);
    //    //            ma.To = fre.FailedRecipient;
    //    //            ma.Failure = string.Format("Delivery failed - status {0}", status.ToString());
    //    //            DataContext.Actions.Add(ma);
    //    //            DataContext.SaveChanges();
    //    //            //Console.WriteLine("Failed to deliver message to {0}",
    //    //            //    fre.FailedRecipient);
    //    //        }
    //    //    };
    //    //    if (mailError is SmtpFailedRecipientException)
    //    //    {
    //    //        handleFailedRecipient(mailError as SmtpFailedRecipientException);
    //    //    }
    //    //    else if (mailError is SmtpFailedRecipientsException)
    //    //    {
    //    //        SmtpFailedRecipientsException ex = (SmtpFailedRecipientsException)mailError;
    //    //        for (int i = 0; i < ex.InnerExceptions.Length; i++)
    //    //        {
    //    //            SmtpFailedRecipientException fre = ex.InnerExceptions[i];
    //    //            handleFailedRecipient(fre);
    //    //        }
    //    //    }
    //    //    else
    //    //    {
    //    //        Log.Write("RecordMailException: what does being here mean?");
    //    //    }
    //    //}
    //    //private MailAction GetBaseRecord(SendMailObject smo)
    //    //{
    //    //    MailAction ma = new MailAction
    //    //    {
    //    //        Subject = smo.MailMessage.Subject,
    //    //        To = smo.Redirected ? smo.OriginalAddress : smo.MailMessage.To.First().Address,
    //    //        From = smo.MailMessage.From.Address,
    //    //        MailTemplate = smo.Template,
    //    //        MailBody = smo.MailMessage.Body,
    //    //        Redirected = smo.Redirected,
    //    //        RedirectedTo = smo.Redirected ? smo.MailMessage.To.First().Address : ""
    //    //    };
    //    //    return ma;
    //    //}
    //    //private void RecordMail(SendMailObject smo, bool mailDisabled = false)
    //    //private void RecordMail(MailMessage mail, string templateName,  dynamic redirectionResult, bool mailDisabled = false)
    //    //{
    //    //    MailMessage mail = smo.MailMessage;
    //    //    string templateName = smo.Template;

    //    //    //var ctx = Core.GetDataContext();
    //    //    MailAction ma = GetBaseRecord(smo);
    //    //    ma.MailDisabled = mailDisabled;
    //    //    //MailAction ma = new MailAction
    //    //    //{
    //    //    //    Subject = mail.Subject,
    //    //    //    To = smo.Redirected ? smo.OriginalAddress :  mail.To.First().Address,
    //    //    //    From = mail.From.Address,
    //    //    //    MailTemplate = templateName,
    //    //    //    MailBody = mail.Body,
    //    //    //    Redirected = smo.Redirected,
    //    //    //    RedirectedTo = smo.Redirected ? mail.To.First().Address : "",
    //    //    //    MailDisabled = mailDisabled
    //    //    //};
    //    //    DataContext.Actions.Add(ma);
    //    //    DataContext.SaveChanges();
    //    //}
    //    //private string GetSiteUrl(string UrlScheme, string UrlAuthority)
    //    //{
    //    //    return string.Format("{0}://{1}", UrlScheme, UrlAuthority);
    //    //}
    //    //private void PostprocessAddresses(SendMailObject smo)
    //    //{
    //    //    MailMessage mail = smo.MailMessage;
    //    //    SmtpSection section = (SmtpSection)ConfigurationManager.GetSection("system.net/mailSettings/smtp");
    //    //    MailAddress originalAddress = mail.To.First();
    //    //    string toAddress = originalAddress.Address;
    //    //    bool redirected = false;
    //    //    string redirectTo = ApplicationSettings.Key<string>("MailRedirectAddress", null);
    //    //    if (redirectTo != null)
    //    //    {
    //    //        toAddress = redirectTo;// AppSettings.Key("MailRedirectAddress", originalAddress.Address);
    //    //        redirected = string.Compare(toAddress, originalAddress.Address, true) != 0;
    //    //    }
    //    //    mail.To.Clear();
    //    //    mail.To.Add(toAddress);
    //    //    string fromAddress = section.From;
    //    //    if (string.Compare(fromAddress, toAddress, true) == 0)
    //    //    {
    //    //        string alternateFromAddress = ApplicationSettings.Key("AlternateFromAddress", string.Empty);
    //    //        if (!string.IsNullOrEmpty(alternateFromAddress))
    //    //        {
    //    //            fromAddress = alternateFromAddress;
    //    //        }
    //    //    }
    //    //    mail.From = new MailAddress(fromAddress);// new MailAddress(section.From);
    //    //    smo.Redirected = redirected;
    //    //    smo.OriginalAddress = originalAddress.Address;
    //    //    return;// new { Redirected = redirected, OriginalAddress = originalAddress.Address };
    //    //}
    //    //private void LogMail(MailMessage mail, bool mailEnabled, bool isRedirected)
    //    //{
    //    //    string fmt = mailEnabled ? "Mail sent to {0}{2}, subject: {1}" : "Mail to [to {0}{2}, subject: {1}] not sent as mail is not enabled";
    //    //    Log.Write(fmt, mail.To.First().Address, mail.Subject, isRedirected ? " (redirected)" : "");
    //    //}

    //    //#region IDisposable Support
    //    //private bool disposedValue = false; // To detect redundant calls

    //    //protected virtual void Dispose(bool disposing)
    //    //{
    //    //    if (!disposedValue)
    //    //    {
    //    //        if (disposing)
    //    //        {
    //    //            // TODO: dispose managed state (managed objects).
    //    //            DataContext.Dispose();
    //    //        }

    //    //        // TODO: free unmanaged resources (unmanaged objects) and override a finalizer below.
    //    //        // TODO: set large fields to null.

    //    //        disposedValue = true;
    //    //    }
    //    //}

    //    //// TODO: override a finalizer only if Dispose(bool disposing) above has code to free unmanaged resources.
    //    //// ~MailHelper() {
    //    ////   // Do not change this code. Put cleanup code in Dispose(bool disposing) above.
    //    ////   Dispose(false);
    //    //// }

    //    //// This code added to correctly implement the disposable pattern.
    //    //public void Dispose()
    //    //{
    //    //    // Do not change this code. Put cleanup code in Dispose(bool disposing) above.
    //    //    Dispose(true);
    //    //    // TODO: uncomment the following line if the finalizer is overridden above.
    //    //    // GC.SuppressFinalize(this);
    //    //}
    //    //#endregion
    //}
}