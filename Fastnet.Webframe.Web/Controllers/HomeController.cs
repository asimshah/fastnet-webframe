
using Fastnet.Common;
using Fastnet.EventSystem;
using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.Mvc;
using Fastnet.Webframe.Web.Common;
using Fastnet.Webframe.Web.Models;
using Microsoft.AspNet.Identity.Owin;
using Microsoft.Owin.Security;
using System;
using System.Diagnostics;
using System.Dynamic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;

namespace Fastnet.Webframe.Web.Controllers
{
    [VerifySession]
    public class HomeController : BaseMvcController //Controller
    {
        //private Member currentMember;
        private CoreDataContext DataContext = Core.GetDataContext();
        private ApplicationSignInManager _signInManager;
        private ApplicationUserManager _userManager;
        private bool InEditMode
        {
            get { return (bool)Session["edit-mode"]; }
            set { Session["edit-mode"] = value; }
        }
        public ApplicationSignInManager SignInManager
        {
            get
            {
                return _signInManager ?? HttpContext.GetOwinContext().Get<ApplicationSignInManager>();
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
                return _userManager ?? HttpContext.GetOwinContext().GetUserManager<ApplicationUserManager>();
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
                return HttpContext.GetOwinContext().Authentication;
            }
        }
        [Route("permissiondenied/{message?}")]
        public ActionResult PermissionDenied(string message)
        {
            ViewBag.Message = message;
            return View();
        }
        [Route("sessiontimedout")]
        public ActionResult SessionTimedout()
        {

            return View();
        }
        // GET: Main/Home
        [Route("page/{id}")]
        [Route("$home")]
        [Route("home")]
        [Route("")]
        public async Task<ActionResult> Index(string id = null)
        {
            var memberCount = DataContext.Members.Where(x => !x.IsAnonymous).Count();
            //Debug.Print("Member count = {0}", memberCount);
            if (memberCount == 0)
            {
                // I assume that we are here because this a is a brand new database that has no Administrator
                // account. Nothing will work until the Administrator account is set up
                return RedirectToAction("CreateAdministrator");
            }
            if (!Request.IsAuthenticated && ApplicationSettings.Key("AutologinAdmin", false))
            {
                MemberBase admin = DataContext.Members.Single(m => m.IsAdministrator);
                var user = await UserManager.FindByIdAsync(admin.Id);
                await SignInManager.SignInAsync(user, false, false);
                admin.LastLoginDate = DateTime.UtcNow;
                Session["current-member"] = admin.Id;
                await DataContext.SaveChangesAsync();
                return RedirectToAction("Index");
            }
            // **NB** I'm recording the member here because:
            // 1. I have not found any way of recovering user information from an apicontroller
            // 2. The user identity information is not updated till after the autologin sign in 
            //    has completed the Redirect back to the Index method. IT IS PROBABLY
            //    true that I can remove the following call to RecordCurrentMember() if
            //    I decide to get rid of "AutologinAdmin" as it is done on login/logoff below)
            //RecordCurrentMember();
            if (id != null)
            {
                long pageId = Convert.ToInt64(id);
                Page page = DataContext.Pages.SingleOrDefault(p => p.PageId == pageId);
                if (page != null)
                {
                    this.SetCurrentPage(page);
                }
            }
            else
            {
                this.SetCurrentPage(null);
            }
            PageModel pm = GetPageModel();// new PageModel(id);


            var homeNoCache = this.Request.Path.EndsWith("$home");
            //CurrentPageId = pm.StartPage;
            return View(pm);
        }
        [Route("enable/edit")]
        public ActionResult EnableEdit()
        {
            InEditMode = true;
            PageModel pm = GetPageModel(ClientSideActions.enabledit);// new PageModel(id);
            return View("Index", pm);
        }
        [Route("stop/edit")]
        public ActionResult StopEdit()
        {
            InEditMode = false;
            return new EmptyResult();
        }
        [Route("disable/edit")]
        public ActionResult DisableEdit()
        {
            InEditMode = false;
            PageModel pm = GetPageModel();// new PageModel(id);
            return View("Index", pm);
        }
        [AllowAnonymous]
        [Route("login")]
        [Route("logon")]
        public ActionResult Login()
        {
            var returnUrl = this.Request.QueryString.Get("ReturnUrl");
            PageModel pm = GetPageModel(ClientSideActions.login);// new PageModel(id);
            if (returnUrl != null)
            {
                pm.ReturnUrl = returnUrl;
            }
            return View("Index", pm);
        }
        [AllowAnonymous]
        [Route("logout")]
        [Route("logoff")]
        public ActionResult Logoff()
        {
            AuthenticationManager.SignOut();
            this.InEditMode = false;
            Session["current-member"] = Member.Anonymous.Id;
            //this.CurrentPageId = null;
            //RecordCurrentMember();
            return RedirectToAction("Index");
            //PageModel pm = GetPageModel();// new PageModel(id);
            //return View("Index", pm);
        }
        [AllowAnonymous]
        [HttpPost]
        [Route("account/login")]
        /// no longer used - login is now in UserController - 28Aug2015
        public async Task<ActionResult> Login(LoginViewModel model)
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

            var user = await UserManager.FindByEmailAsync(model.emailAddress);
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
                    if (CurrentMember != null && model.emailAddress != CurrentMember.EmailAddress)
                    {
                        Logoff();
                    }
                    SignInStatus result = await SignInManager.PasswordSignInAsync(model.emailAddress, model.password, false, false);
                    switch (result)
                    {
                        case SignInStatus.Success:
                            member.LastLoginDate = DateTime.UtcNow;
                            Session["current-member"] = member.Id;
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
                    return Json(new { Success = false, Error = error });
                }
            }
        }
        [AllowAnonymous]
        [Route("register")]
        public ActionResult Register()
        {
            PageModel pm = GetPageModel(ClientSideActions.register);// new PageModel(id);
            // pm.ClientDialog = new RegistrationDialogue();
            return View("Index", pm);
        }
        [AllowAnonymous]
        [Route("paypal/test")]
        public ActionResult PaypalTest()
        {
            return View();
        }
        //[AllowAnonymous]
        //[HttpPost]
        //[Route("account/register")]
        //public async Task<ActionResult> Register(RegistrationViewModel model)
        ////public async Task<ActionResult> Register(string text)
        //{
        //    dynamic data = null;
        //    string emailAddress = data.emailAddress;
        //    string password = data.password;
        //    //string firstName = data.firstName;
        //    //string lastName = data.lastName;
        //    MemberFactory mf = MemberFactory.GetInstance();
        //    dynamic r =  await mf.ValidateRegistration(data);
        //    if (r.Success)
        //    {
        //        var user = new ApplicationUser { UserName = emailAddress, Email = emailAddress };
        //        var result = await UserManager.CreateAsync(user, password);
        //        if (result.Succeeded)
        //        {
        //            bool visiblePassword = ApplicationSettings.Key("VisiblePassword", false) || ApplicationSettings.Key("Membership:EditablePassword", false);
        //            var member = mf.CreateNew(user.Id, data);
        //            if (visiblePassword)
        //            {
        //                member.PlainPassword = password;
        //            }
        //            DataContext.Members.Add(member);
        //            Group.AllMembers.Members.Add(member);
        //            member.ActivationCode = Guid.NewGuid().ToString();
        //            member.ActivationEmailSentDate = DateTime.UtcNow;
        //            member.RecordChanges(null, MemberAction.MemberActionTypes.New);
        //            await DataContext.SaveChangesAsync();
        //            MailHelper mh = new MailHelper();
        //            await mh.SendAccountActivationAsync(member.EmailAddress, this.Request.Url.Scheme, this.Request.Url.Authority, member.Id, member.ActivationCode);
        //            return Json(new { Success = true });
        //        }
        //        return Json(new { Success = false, Error = result.Errors.First() });
        //    }
        //    else
        //    {
        //        return Json(r);
        //    }
        //}
        [AllowAnonymous]
        [Route("activate/{userId}/{code}")]
        public async Task<ActionResult> Activate(string userId, string code)
        {
            MemberBase member = DataContext.Members.SingleOrDefault(m => m.Id == userId);
            if (member != null && member.ActivationCode == code)
            {
                var user = await UserManager.FindByEmailAsync(member.EmailAddress);
                if (!member.EmailAddressConfirmed)
                {
                    member.EmailAddressConfirmed = true;
                    member.ActivationCode = null;
                    user.EmailConfirmed = true;
                }
                await SignInManager.SignInAsync(user, isPersistent: false, rememberBrowser: false);
                member.LastLoginDate = DateTime.UtcNow;
                member.RecordChanges(null, MemberAction.MemberActionTypes.Activation);
                await DataContext.SaveChangesAsync();
                PageModel pm = GetPageModel(ClientSideActions.activationsuccessful, null);// new PageModel(null);
                return View("Index", pm);
            }
            else
            {
                PageModel pm = GetPageModel(ClientSideActions.activationfailed, null);// new PageModel(null);
                return View("Index", pm);
            }
        }
        [HttpPost]
        [AllowAnonymous]
        [Route("account/requestpasswordreset")]
        public async Task<ActionResult> SendPasswordReset(PasswordResetViewModel model)
        {
            if (ModelState.IsValid)
            {
                MemberBase member = DataContext.Members.Single(m => m.EmailAddress == model.emailAddress);
                member.PasswordResetCode = Guid.NewGuid().ToString();
                member.PasswordResetEmailSentDate = DateTime.UtcNow;
                member.RecordChanges(null, MemberAction.MemberActionTypes.PasswordResetRequest);
                await DataContext.SaveChangesAsync();
                MailHelper mh = new MailHelper();
                mh.SendPasswordResetAsync(DataContext, member.EmailAddress, this.Request.Url.Scheme, this.Request.Url.Authority, member.Id, member.PasswordResetCode);
                return Json(new { Success = true });
            }
            else
            {
                return new EmptyResult();
            }
        }
        [AllowAnonymous]
        [Route("passwordreset/{userId}/{code}")]
        public async Task<ActionResult> PasswordReset(string userId, string code)
        {
            MemberBase member = DataContext.Members.SingleOrDefault(m => m.Id == userId);
            if (member != null && member.PasswordResetCode == code)
            {
                member.PasswordResetCode = null; // ensure it cannot be done again
                await DataContext.SaveChangesAsync();
                PageModel pm = GetPageModel(ClientSideActions.changepassword, member);
                return View("Index", pm);
            }
            else
            {
                PageModel pm = GetPageModel(ClientSideActions.passwordresetfailed);// new PageModel(null);
                return View("Index", pm);
            }
        }
        [AllowAnonymous]
        [HttpPost]
        [Route("account/passwordreset")]
        public async Task<ActionResult> ChangePassword(PasswordResetViewModel model)
        {
            if (ModelState.IsValid)
            {
                string emailAddress = model.emailAddress;
                string newPassword = model.password;
                MemberBase member = DataContext.Members.Single(m => m.EmailAddress == model.emailAddress);
                //bool visiblePassword = false;// ApplicationSettings.Key("VisiblePassword", false) || ApplicationSettings.Key("Membership:EditablePassword", false); //SiteSetting.Get("VisiblePassword", false);
                //if (visiblePassword)
                //{
                //    member.PlainPassword = newPassword;
                //}
                member.RecordChanges(null, MemberAction.MemberActionTypes.PasswordReset);
                await DataContext.SaveChangesAsync();
                using (ApplicationDbContext appDb = new ApplicationDbContext())
                {
                    var user = appDb.Users.Find(member.Id);
                    user.PasswordHash = Member.HashPassword(newPassword);
                    user.SecurityStamp = Guid.NewGuid().ToString();
                    await appDb.SaveChangesAsync();
                    await SignInManager.SignInAsync(user, false, false);
                    Session["current-member"] = member.Id;
                    //Redirect("/home");
                    //return RedirectToAction("Index");
                    return Json(new { Success = true });
                }
            }
            return Json(new { Success = false, Error = "System Error!" });
        }
        [AllowAnonymous]
        [HttpGet]
        [Route("account/createadministrator")]
        public ActionResult CreateAdministrator()
        {
            AdministratorViewModel m = new AdministratorViewModel();
            return View(m);
        }
        [AllowAnonymous]
        [HttpPost]
        [Route("account/createadministrator")]
        public async Task<ActionResult> CreateAdministrator(AdministratorViewModel model)
        {
            if (ModelState.IsValid)
            {
                var memberCount = DataContext.Members.Where(x => !x.IsAnonymous).Count();
                if (memberCount == 0)
                {
                    var user = new ApplicationUser { UserName = model.Email, Email = model.Email };
                    var result = await UserManager.CreateAsync(user, model.Password);
                    //var result = UserManager.CreateAsync(user, model.password).Result;
                    if (result.Succeeded)
                    {
                        //bool visiblePassword = ApplicationSettings.Key("VisiblePassword", false) || ApplicationSettings.Key("Membership:EditablePassword", false);// SiteSetting.Get("VisiblePassword", false);
                        //Member member = new Member
                        //{
                        //    Id = user.Id,
                        //    EmailAddress = model.Email,
                        //    EmailAddressConfirmed = true,
                        //    FirstName = "",
                        //    LastName = "Administrator",
                        //    IsAdministrator = true,
                        //    CreationDate = DateTime.UtcNow
                        //};
                        MemberFactory mf = new MemberFactory();
                        dynamic data = new ExpandoObject();
                        data.emailAddress = model.Email;
                        data.firstName = "";
                        data.lastName = "Administrator";
                        MemberBase member = mf.CreateNew(user.Id, data, null);
                        member.EmailAddressConfirmed = true;
                        member.IsAdministrator = true;
                        member.CreationMethod = MemberCreationMethod.SystemGenerated;
                        //if (visiblePassword)
                        //{
                        //    member.PlainPassword = model.Password;
                        //}
                        await SignInManager.SignInAsync(user, isPersistent: false, rememberBrowser: false);

                        member.LastLoginDate = DateTime.UtcNow;
                        DataContext.Members.Add(member);
                        Group.AllMembers.Members.Add(member);
                        Group.Administrators.Members.Add(member);
                        Group.Designers.Members.Add(member);
                        Group.Editors.Members.Add(member);
                        //Debug.Print("Saving member {0} ...", member.Id);
                        int x = await DataContext.SaveChangesAsync();
                        Session["current-member"] = member.Id;
                        //Debug.Print("... saved member {0}, returned {1}", member.Id, x);
                        return RedirectToAction("AdminConfirmed");
                    }
                    //return Json(new { Success = false, Error = result.Errors.First() }, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    Log.Write(EventSeverities.Error, "CreateAdministrator() called with invalid member count = {0}", memberCount);
                }
            }
            return View();
        }
        [HttpGet]
        [Route("account/adminconfirmed")]
        public ActionResult AdminConfirmed()
        {
            return View();
        }
        [HttpPost]
        [Route("account/adminconfirmed")]
        public ActionResult AdminConfirmedPostback()
        {
            return RedirectToAction("Index");
        }
        [HttpGet]
        [AllowAnonymous]
        [Route("account/addressinuse")]
        public async Task<ActionResult> CheckEmailAddressInUse(string emailAddress)
        {
            ApplicationUser user = await UserManager.FindByEmailAsync(emailAddress);
            return Json(new { InUse = user != null }, JsonRequestBehavior.AllowGet);
            //return Json(user == null, JsonRequestBehavior.AllowGet);
        }
        [HttpGet]
        [AllowAnonymous]
        [Route("account/currentuser")]
        public async Task<ActionResult> GetCurrentUser()
        {
            if (User.Identity.IsAuthenticated)
            {
                var user = await UserManager.FindByEmailAsync(User.Identity.Name);
                var member = DataContext.Members.Single(m => m.Id == user.Id);
                //string name = string.Join(" ", member.FirstName, member.LastName).Trim();
                return Json(new { Authenticated = true, Name = member.Fullname, EmailAddress = member.EmailAddress }, JsonRequestBehavior.AllowGet);
            }
            else
            {
                return Json(new { Authenticated = false }, JsonRequestBehavior.AllowGet);
            }
        }
        [Authorize]
        [HttpPost]
        [Route("account/updateuser")]
        public ActionResult UpdateUser(MemberUpdateViewModel model)
        {
            if (ModelState.IsValid)
            {
                var member = DataContext.Members.Single(m => m.EmailAddress == model.emailAddress);
                member.FirstName = model.firstName;
                member.LastName = model.lastName;
                member.RecordChanges();
                DataContext.SaveChanges();
                return Json(new { Success = true });
            }
            else
            {
                return Json(new { Success = false, Error = "UpdateUser: System error" });
            }
        }
        [HttpGet]
        [AllowAnonymous]
        [Route("model/{dialogue}")]
        public ActionResult PageModel(string dialogue)
        {
            // when the client needs to show a dialogue as a result of an internal process
            // (as opposed to the user providing a url in the browser address bar such as .../register)
            // then the javascript needs the data from the corresponding page model, in particular the
            // ClientDialog (so that any data therein is available in the client)
            // this method helps achieve this.
            ClientSideActions name = (ClientSideActions)Enum.Parse(typeof(ClientSideActions), dialogue);
            PageModel pm = GetPageModel(name);
            return Json(pm, JsonRequestBehavior.AllowGet);
        }
        [HttpGet]
        [AllowAnonymous]
        [Route("model/permitted/{dialogue}")]
        public ActionResult PageIsDialogPermittedModel(string dialogue)
        {
            bool permitted = false;
            string reason = string.Empty;
            ClientSideActions name = (ClientSideActions)Enum.Parse(typeof(ClientSideActions), dialogue);
            switch (name)
            {
                case ClientSideActions.userprofile:
                    var m = this.GetCurrentMember();
                    if (m.IsAdministrator)
                    {
                        permitted = false;
                        reason = "The Administrator account has no user profile";
                    }
                    else if (m.IsAnonymous)
                    {
                        permitted = false;
                        reason = "PLease login first";
                    }
                    else
                    {
                        permitted = true;
                    }
                    break;
                default:
                    break;
            }
            return Json(new { Permitted = permitted, Reason = reason }, JsonRequestBehavior.AllowGet);
        }
        [HttpGet]
        [AllowAnonymous]
        [Route("account/test")]
        public ActionResult Test1()
        {
            //Debugger.Break();
            return new EmptyResult();
        }
        private ActionResult RedirectToLocal(string returnUrl)
        {
            if (Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }
            return RedirectToAction("Index", "Home");
        }
        private PageModel GetPageModel()
        {
            Page page = this.GetCurrentPage();
            PageModel pm = new PageModel(page, this.GetCurrentMember());
            return pm;
        }
        private PageModel GetPageModel(ClientSideActions name)
        {
            MemberBase member = null;
            if (User.Identity.IsAuthenticated)
            {
                //var user = await UserManager.FindByEmailAsync(User.Identity.Name);
                member = DataContext.Members.Single(m => m.EmailAddress == User.Identity.Name);
            }
            PageModel pm = GetPageModel();// new PageModel(pageId);
            pm.SetClientAction(name, member);
            return pm;
        }
        private PageModel GetPageModel(ClientSideActions name, MemberBase member)
        {
            PageModel pm = GetPageModel();
            pm.SetClientAction(name, member);
            return pm;
        }
        //private void RecordCurrentMember()
        //{
        //    Member member = null;
        //    if (User.Identity.IsAuthenticated)
        //    {
        //        member = DataContext.Members.Single(m => m.EmailAddress == User.Identity.Name);
        //    }
        //    else
        //    {
        //        member = DataContext.Members.Single(x => x.IsAnonymous);
        //    }
        //    this.SetCurrentMember(member);
        //}
    }

}
