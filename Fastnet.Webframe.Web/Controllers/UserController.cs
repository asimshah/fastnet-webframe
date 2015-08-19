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

namespace Fastnet.Webframe.Web.Controllers
{
    [RoutePrefix("user")]
    public class UserController : BaseApiController
    {
        private CoreDataContext DataContext = Core.GetDataContext();
        private ApplicationUserManager _userManager;
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
        [HttpPost]
        [Route("register")]
        public async Task<HttpResponseMessage> Register(dynamic data)
        {
            string emailAddress = data.emailAddress;
            string password = data.password;
            MemberFactory mf = MemberFactory.GetInstance();
            dynamic r = await mf.ValidateRegistration(data);
            if (r.Success)
            {
                using (TransactionScope tran = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled))
                {
                    try
                    {
                        var user = new ApplicationUser { UserName = emailAddress, Email = emailAddress };
                        var result = await UserManager.CreateAsync(user, password);
                        if (result.Succeeded)
                        {
                            //bool visiblePassword = ApplicationSettings.Key("VisiblePassword", false) || ApplicationSettings.Key("Membership:EditablePassword", false);
                            var member = mf.CreateNew(user.Id, data);
                            //if (visiblePassword)
                            //{
                            //    member.PlainPassword = password;
                            //}
                            DataContext.Members.Add(member);
                            Group.AllMembers.Members.Add(member);
                            member.ActivationCode = Guid.NewGuid().ToString();
                            member.ActivationEmailSentDate = DateTime.UtcNow;
                            member.RecordChanges(null, MemberAction.MemberActionTypes.New);
                            await DataContext.SaveChangesAsync();
                            MailHelper mh = new MailHelper();
                            await mh.SendAccountActivationAsync(member.EmailAddress, this.Request.RequestUri.Scheme, this.Request.RequestUri.Authority, member.Id, member.ActivationCode);
                            tran.Complete();
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
                }
            }
            else
            {
                return this.Request.CreateResponse(HttpStatusCode.OK, new { Success = r.Success, Error = r.Error });
                //return Json(r);
            }
            //return this.Request.CreateResponse(HttpStatusCode.OK);
        }
    }
}
