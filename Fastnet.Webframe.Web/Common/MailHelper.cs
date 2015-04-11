using Fastnet.Common;
using Fastnet.EventSystem;
using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Net.Configuration;
using System.Net.Mail;
using System.Threading.Tasks;
using System.Web;


namespace Fastnet.Webframe.Web.Common
{
    public class MailHelper
    {
        //private static string siteUrl = null;
        //private static string SiteUrl
        //{
        //    get
        //    {
        //        if (siteUrl == null)
        //        {
        //            siteUrl = NameValueSettings.Key("SiteUrl", "");
        //        }
        //        return siteUrl;
        //    }
        //}
        //private static string adminEmailAddress = null;
        //private static string AdminEmailAddress
        //{
        //    get
        //    {
        //        if(adminEmailAddress == null)
        //        {
        //            adminEmailAddress = GetAdminEmailAddress();
        //        }
        //        return adminEmailAddress;
        //    }
        //}
        public async Task SendPasswordResetAsync(string destination, string UrlScheme, string UrlAuthority, string userId, string code)
        {
            string siteUrl = GetSiteUrl(UrlScheme, UrlAuthority);// string.Format("{0}://{1}", UrlScheme, UrlAuthority);
            string subject = string.Format("Password Reset for {0}", siteUrl);
            string callbackUrl = string.Format("{0}/passwordreset/{1}/{2}", siteUrl, userId, code);
            string text = EmailTemplate.PasswordReset.GetTemplate();
            //var tf = new TemplateFactory { EmailType = EmailTypes.PasswordReset };
            //string text = tf.GetEmailTemplate();
            //string text = TemplateFactory.GetEmailTemplate(EmailTypes.PasswordReset);// .GetTemplate(EmailTemplates.AccountActivation);            
            string body = string.Format(text, siteUrl, callbackUrl, Globals.AdminEmailAddress);
            await SendMailAsync(destination, subject, body);
        }
        public async Task SendAccountActivationAsync(string destination, string UrlScheme, string UrlAuthority, string userId, string activationCode)
        {
            string siteUrl = GetSiteUrl(UrlScheme, UrlAuthority);// string.Format("{0}://{1}", UrlScheme, UrlAuthority);
            string subject = string.Format("Welcome to {0}", siteUrl);
            string callbackUrl = string.Format("{0}/activate/{1}/{2}", siteUrl, userId, activationCode);
            string text = EmailTemplate.AccountActivation.GetTemplate();
            //var tf = new TemplateFactory { EmailType = EmailTypes.AccountActivation };
            //string text = tf.GetEmailTemplate();
            //string text = TemplateFactory.GetEmailTemplate(EmailTypes.AccountActivation);// .GetTemplate(EmailTemplates.AccountActivation);            
            string body = string.Format(text, siteUrl, callbackUrl, Globals.AdminEmailAddress);
            await SendMailAsync(destination, subject, body);
            //MailMessage mail = new MailMessage("noreply@webframe.co.uk", destination, subject, body);
            //mail.IsBodyHtml = true;
            //var isRedirected = PostprocessAddresses(mail);
            //await SendMailAsync(mail, isRedirected);
        }
        private async Task SendMailAsync(string destination, string subject, string body)
        {
            //string text = TemplateFactory.GetEmailTemplate(EmailTypes.AccountActivation);// .GetTemplate(EmailTemplates.AccountActivation);
            //string subject = string.Format("Welcome to {0}", siteUrl);
            //string body = string.Format(text, siteUrl, callbackUrl, AdminEmailAddress);
            MailMessage mail = new MailMessage("noreply@webframe.co.uk", destination, subject, body);
            mail.IsBodyHtml = true;
            var isRedirected = PostprocessAddresses(mail);
            await SendMailAsync(mail, isRedirected);
        }
        private string GetSiteUrl(string UrlScheme, string UrlAuthority)
        {
            return string.Format("{0}://{1}", UrlScheme, UrlAuthority);
        }
        private bool PostprocessAddresses(MailMessage mail)
        {
            SmtpSection section = (SmtpSection)ConfigurationManager.GetSection("system.net/mailSettings/smtp");
            MailAddress originalAddress = mail.To.First();
            string toAddress = originalAddress.Address;
            bool redirected = false;
            string redirectTo = ApplicationSettings.Key<string>("MailRedirectAddress", null);
            if (redirectTo != null)
            {
                toAddress = redirectTo;// AppSettings.Key("MailRedirectAddress", originalAddress.Address);
                redirected = string.Compare(toAddress, originalAddress.Address, true) != 0;
            }
            mail.To.Clear();
            mail.To.Add(toAddress);
            string fromAddress = section.From;
            if (string.Compare(fromAddress, toAddress, true) == 0)
            {
                string alternateFromAddress = ApplicationSettings.Key("AlternateFromAddress", string.Empty);
                if (!string.IsNullOrEmpty(alternateFromAddress))
                {
                    fromAddress = alternateFromAddress;
                }
            }
            mail.From = new MailAddress(fromAddress);// new MailAddress(section.From);
            return redirected;
        }
        //private static string GetAdminEmailAddress()
        //{
        //    using (CoreDataReadOnly DataContext = new CoreDataReadOnly())
        //    {
        //        Member adminMember = DataContext.Members.Single(m => m.IsAdministrator);
        //        return adminMember.EmailAddress;
        //    }
        //}
        private async Task SendMailAsync(MailMessage mail, bool isRedirected)
        {
            bool mailEnabled = ApplicationSettings.Key("MailEnabled", true);
            if (mailEnabled)
            {
                SmtpClient client = new SmtpClient();// new SmtpClient(smtpHost);
                await client.SendMailAsync(mail);
            }
            LogMail(mail, mailEnabled, isRedirected);
        }
        private void LogMail(MailMessage mail, bool mailEnabled, bool isRedirected)
        {
            string fmt = mailEnabled ? "Mail sent to {0}{2}, subject: {1}" : "Mail to [to {0}{2}, subject: {1}] not sent as mail is not enabled";
            Log.Write(fmt, mail.To.First().Address, mail.Subject, isRedirected ? " (redirected)" : "");
        }
    }
}