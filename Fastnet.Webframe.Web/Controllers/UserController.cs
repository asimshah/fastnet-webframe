using Fastnet.Webframe.WebApi;
using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNet.Identity.Owin;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;
using System.Threading.Tasks;
using Fastnet.Common;
using Fastnet.Webframe.Web.Common;
using System.Transactions;
using Fastnet.EventSystem;
using Microsoft.Owin.Security;

namespace Fastnet.Webframe.Web.Controllers
{
    [RoutePrefix("user")]
    public class UserController : BaseApiController
    {
        private CoreDataContext DataContext = Core.GetDataContext();
        private ApplicationUserManager _userManager;
        private ApplicationSignInManager _signInManager;
        public ApplicationSignInManager SignInManager
        {
            get
            {
                return _signInManager ?? HttpContext.Current.GetOwinContext().Get<ApplicationSignInManager>();
            }
            private set
            {
                _signInManager = value;
            }
        }
        public ApplicationUserManager UserManager
        {
            get
            {
                return _userManager ?? HttpContext.Current.GetOwinContext().GetUserManager<ApplicationUserManager>();
            }
            private set
            {
                _userManager = value;
            }
        }
        private IAuthenticationManager AuthenticationManager
        {
            get
            {
                return HttpContext.Current.GetOwinContext().Authentication;
            }
        }
        [HttpPost]
        [Route("register")]
        public async Task<HttpResponseMessage> Register(dynamic data)
        {
            string emailAddress = data.emailAddress;
            string password = data.password;
            MemberFactory mf = MemberFactory.GetInstance();
            dynamic r = await mf.ValidateRegistration(data);
            if (r.Success || r.ApiEnabled == false)
            {
                //using (TransactionScope tran = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled))
                //{
                    try
                    {
                        //r.Success
                        var user = new ApplicationUser { UserName = emailAddress, Email = emailAddress };
                        var result = await UserManager.CreateAsync(user, password);
                        if (result.Succeeded)
                        {
                            MemberBase member = mf.CreateNew(user.Id, data, r);
                            member.CreationMethod = MemberCreationMethod.SelfRegistration;
                            DataContext.Members.Add(member);
                           
                            //Group.AllMembers.Members.Add(member);
                            member.ActivationCode = Guid.NewGuid().ToString();
                            member.ActivationEmailSentDate = DateTime.UtcNow;
                            member.RecordChanges(null, MemberAction.MemberActionTypes.New);
                            await DataContext.SaveChangesAsync();
                            mf.AssignGroups(member);
                            await DataContext.SaveChangesAsync();
                            MailHelper mh = new MailHelper();
                            mh.SendAccountActivationAsync(DataContext, member.EmailAddress, this.Request.RequestUri.Scheme, this.Request.RequestUri.Authority, member.Id, member.ActivationCode);
                            Log.Write("Member created: {0} ({{1}})", member.EmailAddress, member.Fullname);
                            //tran.Complete();
                            return this.Request.CreateResponse(HttpStatusCode.OK, new { Success = true });
                        }
                        else
                        {
                            return this.Request.CreateResponse(HttpStatusCode.OK, new { Success = true, Error = result.Errors.First() });
                        }
                    }
                    catch (Exception xe)
                    {
                        Log.Write(xe);
                        return this.Request.CreateResponse(HttpStatusCode.OK, new { Success = false, Error = "Internal System Error!" });
                        throw;
                    }
                //}
            }
            else
            {
                return this.Request.CreateResponse(HttpStatusCode.OK, new { Success = r.Success, Error = r.Error });
                //return Json(r);
            }
            //return this.Request.CreateResponse(HttpStatusCode.OK);
        }
        [AllowAnonymous]
        [HttpPost]
        [Route("login")]
        public async Task<dynamic> Login(dynamic data)
        {
            Func<SignInStatus, string> statusToString = (sis) =>
            {
                string text = "system error";
                switch (sis)
                {
                    case SignInStatus.Failure:
                        text = "Invalid credentials";
                        break;
                    case SignInStatus.LockedOut:
                        text = "This account is locked out";
                        break;
                    case SignInStatus.RequiresVerification:
                        text = "This account is not verified";
                        break;
                    default:
                    case SignInStatus.Success:
                        // we should never reach here!
                        break;
                }
                return text;
            };
            string emailAddress = data.emailAddress;
            string password = data.password;
            var user = await UserManager.FindByEmailAsync(emailAddress);
            if (user == null)
            {
                return Json(new { Success = false, Error = "Invalid Credentials" });
            }
            else
            {
                var CurrentMember = this.GetCurrentMember();
                var member = DataContext.Members.Single(m => m.Id == user.Id);
                //if (member.IsAdministrator || await UserManager.IsEmailConfirmedAsync(user.Id))
                if (member.IsAdministrator || (member.EmailAddressConfirmed && !member.Disabled))
                {
                    if (CurrentMember != null && emailAddress != CurrentMember.EmailAddress)
                    {
                        Logoff();
                    }
                    SignInStatus result = await SignInManager.PasswordSignInAsync(emailAddress, password, false, false);
                    switch (result)
                    {
                        case SignInStatus.Success:
                            member.LastLoginDate = DateTime.UtcNow;
                            HttpContext.Current.Session["current-member"] = member.Id;
                            return Json(new { Success = true });
                        default:
                            return Json(new { Success = false, Error = statusToString(result) });
                    }
                }
                else
                {
                    string error = "System error!";
                    if (!member.EmailAddressConfirmed)
                    {
                        error = "This account has not been activated";
                    }
                    else if (member.Disabled)
                    {
                        error = "This account is barred";
                    }
                    return new { Success = false, Error = error };
                }
            }
        }
        private void Logoff()
        {
            AuthenticationManager.SignOut();
            //this.InEditMode = false;
            HttpContext.Current.Session["current-member"] = Member.Anonymous.Id;
        }
    }
}
