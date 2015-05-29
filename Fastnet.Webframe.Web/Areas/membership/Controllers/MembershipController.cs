﻿using Fastnet.Common;
using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.Web.Areas.membership.Models;
using Fastnet.Webframe.Web.Common;
using Fastnet.Webframe.Web.Controllers;
using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Diagnostics;
using System.Dynamic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;

namespace Fastnet.Webframe.Web.Areas.membership.Controllers
{
    [RoutePrefix("membershipapi")]
    public class MembershipController : ApiController
    {
        private CoreDataContext DataContext = Core.GetDataContext();
        [HttpGet]
        [Route("banner")]
        public HttpResponseMessage GetBannerHtml()
        {
            PageContent bannerContent = DataContext.GetDefaultLandingPage()[ContentPanels.Banner];
            if (bannerContent != null)
            {
                return this.Request.CreateResponse(HttpStatusCode.OK, new { Success = true, Styles = bannerContent.HtmlStyles, Html = bannerContent.HtmlText });
            }
            else
            {
                return this.Request.CreateResponse(HttpStatusCode.OK, new { Success = false });
            }
        }
        [HttpGet]
        [Route("get/member/{memberId}")]
        public async Task<HttpResponseMessage> GetMemberDetails(string memberId)
        {
            var member = await DataContext.Members.FindAsync(memberId);
            string plainPassword = string.Empty;
            var options = new MembershipOptions();
            if (options.VisiblePassword)
            {
                plainPassword = member.PlainPassword;
            }
            var result = new
            {
                Id = member.Id,
                EmailAddress = member.EmailAddress,
                FirstName = member.FirstName,
                LastName = member.LastName,
                IsDisabled = member.Disabled,
                IsAdministrator = member.IsAdministrator,
                CreationDate = member.CreationDate.ToString("ddMMMyyyy HH:mm:ss"),
                LastLoginDate = member.LastLoginDate.HasValue ? member.LastLoginDate.Value.ToString("ddMMMyyyy HH:mm:ss") : null,
                EmailConfirmed = member.EmailAddressConfirmed,
                PlainPassword = plainPassword
            };

            return this.Request.CreateResponse(HttpStatusCode.OK, result);
        }
        [HttpGet]
        [Route("get/members/{searchtext}/{prefix?}")]
        public async Task<HttpResponseMessage> GetMembers(string searchText, bool prefix = false)
        {
            var members = await FindMembers(searchText, prefix);
            //var result = members.Select(m => new
            //{
            //    Id = m.Id,
            //    Name = m.Fullname,
            //    IsAdministrator = m.IsAdministrator,
            //    IsDisabled = m.Disabled,
            //    EmailConfirmed = m.EmailAddressConfirmed
            //});
            var result = members.Select(m => GetClientSideMemberIndexDetails(m));
            return this.Request.CreateResponse(HttpStatusCode.OK, result);
        }
        [HttpGet]
        [Route("get/members/all")]
        public async Task<HttpResponseMessage> GetAllMembers()
        {
            var members = await DataContext.Members.ToArrayAsync();
            var result = members.Select(m => new
            {
                Id = m.Id,
                EmailAddress = m.EmailAddress,
                FirstName = m.FirstName,
                LastName = m.LastName,
                CreationDate = m.CreationDate,
                LastLoginDate = m.LastLoginDate,
                Disabled = m.Disabled,
                EmailConfirmed = m.EmailAddressConfirmed
            });
            return this.Request.CreateResponse(HttpStatusCode.OK, result);
        }
        [HttpPost]
        [Route("create/member")]
        public async Task<HttpResponseMessage> CreateMember(dynamic data)
        {
            string emailAddress = data.emailAddress;
            string firstName = data.firstname;
            string lastName = data.lastName;
            string password = data.password;
            bool isDisabled = data.isDisabled;

            var user = new ApplicationUser { UserName = emailAddress, Email = emailAddress };
            var appUserManager = HttpContext.Current.GetOwinContext().GetUserManager<ApplicationUserManager>();
            var result = await appUserManager.CreateAsync(user, password);
            if (result.Succeeded)
            {
                bool visiblePassword = ApplicationSettings.Key("VisiblePassword", false) || ApplicationSettings.Key("Membership:EditablePassword", false);// SiteSetting.Get("VisiblePassword", false);
                Member member = new Member
                {
                    Id = user.Id,
                    EmailAddress = emailAddress,
                    FirstName = firstName,
                    LastName = lastName,
                    CreationDate = DateTime.UtcNow
                };
                if (visiblePassword)
                {
                    member.PlainPassword = password;
                }
                DataContext.Members.Add(member);
                Fastnet.Webframe.CoreData.Group.AllMembers.Members.Add(member);
                member.ActivationCode = Guid.NewGuid().ToString();
                member.ActivationEmailSentDate = DateTime.UtcNow;
                member.RecordChanges(this.GetCurrentMember().Fullname, MembershipAction.ActionTypes.New);
                await DataContext.SaveChangesAsync();
                MailHelper mh = new MailHelper();                
                await mh.SendAccountActivationAsync(member.EmailAddress, this.Request.RequestUri.Scheme, this.Request.RequestUri.Authority, member.Id, member.ActivationCode);                
            }
            return this.Request.CreateResponse(HttpStatusCode.OK);
        }
        [HttpPost]
        [Route("delete/member")]
        public async Task<HttpResponseMessage> DeleteMember(dynamic data)
        {
            //MembershipOptions options = new MembershipOptions();
            string id = data.id;
            Member m = await DataContext.Members.FindAsync(id);
            if (!m.IsAdministrator)
            {
                var appUserManager = HttpContext.Current.GetOwinContext().GetUserManager<ApplicationUserManager>();
                var user = await appUserManager.FindByIdAsync(id);
                await appUserManager.DeleteAsync(user);
                var groups = m.Groups.ToArray();
                foreach (Fastnet.Webframe.CoreData.Group g in groups)
                {
                    g.Members.Remove(m);
                }
                m.RecordChanges(this.GetCurrentMember().Fullname, MembershipAction.ActionTypes.Deletion);
                DataContext.Members.Remove(m);
                await DataContext.SaveChangesAsync();
                Debug.Print("Member {0} ({1}) deleted", m.EmailAddress, m.Id);
            }
            return this.Request.CreateResponse(HttpStatusCode.OK);
        }
        [HttpPost]
        [Route("update/member")]
        public async Task<HttpResponseMessage> UpdateMember(dynamic data)
        {
            MembershipOptions options = new MembershipOptions();
            string id = data.id;
            string newEmailAddress = data.emailAddress;
            string newPassword = data.password;
            string newFirstName = data.firstName;
            string newLastName = data.lastName;
            bool newDisabled = data.isDisabled;
            Member m = await DataContext.Members.FindAsync(id);
            string oldEmailAddress = m.EmailAddress.ToLower();
            newEmailAddress = newEmailAddress.ToLower();
            bool emailAddressChanged = oldEmailAddress != newEmailAddress;
            bool passwordHasChanged = false;
            if (options.EditablePassword)
            {
                string oldPassword = m.PlainPassword;

                passwordHasChanged = oldPassword != newPassword;
                m.PlainPassword = newPassword;
            }
            if (emailAddressChanged || passwordHasChanged)
            {
                // need to update the identity system
                var appUserManager = HttpContext.Current.GetOwinContext().GetUserManager<ApplicationUserManager>();
                var user = await appUserManager.FindByIdAsync(id);
                if (passwordHasChanged)
                {
                    user.PasswordHash = Member.HashPassword(newPassword);
                    user.SecurityStamp = Guid.NewGuid().ToString();
                }
                if (emailAddressChanged)
                {
                    user.Email = newEmailAddress;
                    user.UserName = newEmailAddress;
                }
                await appUserManager.UpdateAsync(user);

            }
            m.EmailAddress = newEmailAddress;
            m.FirstName = newFirstName;// data.firstName;
            m.LastName = newLastName;// data.lastName;
            m.Disabled = newDisabled;// data.isDisabled;
            if (emailAddressChanged)
            {
                // send activation email
                m.EmailAddressConfirmed = false;
                m.ActivationCode = Guid.NewGuid().ToString();
                m.ActivationEmailSentDate = DateTime.UtcNow;
            }
            m.RecordChanges(this.GetCurrentMember().Fullname);
            await DataContext.SaveChangesAsync();
            //recordMemberChanges(m, newEmailAddress, newFirstName, newLastName, newDisabled);
            if (emailAddressChanged)
            {
                MailHelper mh = new MailHelper();
                var request = HttpContext.Current.Request;
                await mh.SendEmailAddressChangedAsync(m.EmailAddress, request.Url.Scheme, request.Url.Authority, m.Id, m.ActivationCode);
                m.RecordChanges(this.GetCurrentMember().Fullname, MembershipAction.ActionTypes.Deactivation);
                await DataContext.SaveChangesAsync();
            }
            var r = GetClientSideMemberIndexDetails(m);
            return this.Request.CreateResponse(HttpStatusCode.OK, r);
        }
        [HttpPost]
        [Route("send/activationmail")]
        public async Task<HttpResponseMessage> SendActivationEmail(dynamic data)
        {
            string id = data.id;
            Member m = await DataContext.Members.FindAsync(id);
            bool currentlyActive = m.EmailAddressConfirmed;
            var appUserManager = HttpContext.Current.GetOwinContext().GetUserManager<ApplicationUserManager>();
            var user = await appUserManager.FindByIdAsync(id);
            user.EmailConfirmed = false;
            m.EmailAddressConfirmed = false;
            m.ActivationCode = Guid.NewGuid().ToString();
            m.ActivationEmailSentDate = DateTime.UtcNow;
            await appUserManager.UpdateAsync(user);
            if (currentlyActive)
            {
                m.RecordChanges(this.GetCurrentMember().Fullname, MembershipAction.ActionTypes.Deactivation);
            }
            await DataContext.SaveChangesAsync();
            MailHelper mh = new MailHelper();            
            await mh.SendAccountActivationAsync(m.EmailAddress, this.Request.RequestUri.Scheme, this.Request.RequestUri.Authority, m.Id, m.ActivationCode);
            var r = GetClientSideMemberIndexDetails(m);
            return this.Request.CreateResponse(HttpStatusCode.OK, r);
        }
        [HttpPost]
        [Route("send/passwordresetrequest")]
        public async Task<HttpResponseMessage> SendPasswordResetRequest(dynamic data)
        {
            string id = data.id;
            Member member = await DataContext.Members.FindAsync(id);
            member.PasswordResetCode = Guid.NewGuid().ToString();
            member.PasswordResetEmailSentDate = DateTime.UtcNow;
            member.RecordChanges(this.GetCurrentMember().Fullname, MembershipAction.ActionTypes.PasswordResetRequest);
            await DataContext.SaveChangesAsync();
            MailHelper mh = new MailHelper();
            await mh.SendPasswordResetAsync(member.EmailAddress, this.Request.RequestUri.Scheme, this.Request.RequestUri.Authority, member.Id, member.PasswordResetCode);
            return this.Request.CreateResponse(HttpStatusCode.OK);
        }
        private async Task<IEnumerable<Member>> FindMembers(string searchText, bool prefix)
        {
            Func<string, string, bool> match = (fn, ln) =>
            {
                if (searchText.Contains("*"))
                {
                    while (searchText.Contains("**"))
                    {
                        searchText = searchText.Replace("**", "*");
                    }
                    searchText = searchText.Replace("*", ".*?");
                    Regex regex = new Regex(searchText);
                    return regex.IsMatch(fn) || regex.IsMatch(ln);
                }
                else if (prefix)
                {
                    if (searchText == "#")
                    {
                        bool result = !(fn.Length > 0 && char.IsLetter(fn, 0) || ln.Length > 0 && char.IsLetter(ln, 0));
                        return result;
                    }
                    else
                    {
                        return fn.StartsWith(searchText, StringComparison.InvariantCultureIgnoreCase) || ln.StartsWith(searchText, StringComparison.InvariantCultureIgnoreCase);
                    }
                }
                else
                {
                    string name = fn + " " + ln;
                    return name.IndexOf(searchText, StringComparison.InvariantCultureIgnoreCase) >= 0;
                }
            };
            bool currentIsAdministrator = this.GetCurrentMember().IsAdministrator;
            var temp = await DataContext.Members
                .Where(x => currentIsAdministrator || x.IsAdministrator == false)
                .Select(m => new { Id = m.Id, m.FirstName, m.LastName } ).ToArrayAsync();

            var selectedMembers = temp.Where(x => match(x.FirstName, x.LastName));
            var keys = selectedMembers.Select(x => x.Id);
            return await DataContext.Members.Where(x => keys.Contains(x.Id)).OrderBy(x => x.LastName).ToArrayAsync();
        }
        private object GetClientSideMemberIndexDetails(Member m)
        {
            return new
            {
                Id = m.Id,
                Name = m.Fullname,
                IsAdministrator = m.IsAdministrator,
                IsDisabled = m.Disabled,
                EmailConfirmed = m.EmailAddressConfirmed
            };
        }
    }
}