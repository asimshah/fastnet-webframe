
using Fastnet.Common;
using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.Web.Common;
using Fastnet.Webframe.Web.Models;
using Microsoft.AspNet.Identity.Owin;
using Microsoft.Owin.Security;
using Newtonsoft.Json;
using System;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;

namespace Fastnet.Webframe.Web.Controllers
{

    //[RouteArea("main")]
    //[RoutePrefix("home")]
    public class HomeController : Controller
    {
        private Member currentMember;
        private CoreDataContext DataContext = Core.GetDataContext();
        private ApplicationSignInManager _signInManager;
        private ApplicationUserManager _userManager;
        private string CurrentMemberId
        {
            get
            {
                if (Session["member-id"] == null)
                {
                    return null;
                }
                return (string)Session["member-id"];
            }
            set
            {
                Session["member-id"] = value;
                Debug.Print("recorded member {0}", value ?? "null");
            }
        }
        private string CurrentPageId
        {
            get { return (string)Session["current-page-id"]; }
            set { Session["current-page-id"] = value; }
        }
        private bool InEditMode
        {
            get { return (bool)Session["edit-mode"]; }
            set { Session["edit-mode"] = value; }
        }
        private Member CurrentMember
        {
            get
            {
                if (currentMember == null)
                {
                    currentMember = GetCurrentMember();
                }
                return currentMember;
            }
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
        // GET: Main/Home
        [Route("page/{id}")]
        [Route("$home")]
        [Route("home")]
        [Route("")]
        public async Task<ActionResult> Index(string id = null)
        {
            var memberCount = DataContext.Members.Count();
            //Debug.Print("Member count = {0}", memberCount);
            if (memberCount == 0)
            {
                // I assume that we are here because this a is a brand new database that has no Administrator
                // account. Nothing will work until the Administrator account is set up
                return RedirectToAction("CreateAdministrator");
            }
            if (!Request.IsAuthenticated && ApplicationSettings.Key("AutologinAdmin", false))
            {
                Member admin = DataContext.Members.Single(m => m.IsAdministrator);
                var user = await UserManager.FindByIdAsync(admin.Id);
                await SignInManager.SignInAsync(user, false, false);
                //RecordCurrentMember();
                return RedirectToAction("Index");
            }
            // **NB** I'm recording the member here because:
            // 1. I have not found any way of recovering user information from an apicontroller
            // 2. The user identity information is not updated till after the autologin sign in 
            //    has completed the Redirect back to the Index method. IT IS PROBABLY
            //    true that I can remove the following call to RecordCurrentMember() if
            //    I decide to get rid of "AutologinAdmin" as it is done on login/logoff below)
            RecordCurrentMember();
            if (id != null)
            {
                this.CurrentPageId = id;
            }
            PageModel pm = GetPageModel();// new PageModel(id);


            var homeNoCache = this.Request.Path.EndsWith("$home");
            CurrentPageId = pm.StartPage;
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
        public ActionResult Login()
        {
            PageModel pm = GetPageModel(ClientSideActions.login);// new PageModel(id);
            return View("Index", pm);
        }
        [AllowAnonymous]
        [Route("logoff")]
        public ActionResult Logoff()
        {
            AuthenticationManager.SignOut();
            this.InEditMode = false;
            this.CurrentPageId = null;
            RecordCurrentMember();
            return RedirectToAction("Index");
            //PageModel pm = GetPageModel();// new PageModel(id);
            //return View("Index", pm);
        }
        [AllowAnonymous]
        [HttpPost]
        [Route("account/login")]
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
                Member member = DataContext.Members.Single(m => m.Id == user.Id);
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
                            RecordCurrentMember();
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
        [HttpPost]
        [Route("account/register")]
        public async Task<ActionResult> Register(RegistrationViewModel model)
        {
            var user = new ApplicationUser { UserName = model.emailAddress, Email = model.emailAddress };
            var result = await UserManager.CreateAsync(user, model.password);
            if (result.Succeeded)
            {
                bool visiblePassword = SiteSetting.Get("VisiblePassword", false);
                Member member = new Member
                {
                    Id = user.Id,
                    EmailAddress = model.emailAddress,
                    FirstName = model.firstName,
                    LastName = model.lastName,
                    CreationDate = DateTime.Now
                };
                if (visiblePassword)
                {
                    member.PlainPassword = model.password;
                }
                //await SignInManager.SignInAsync(user, isPersistent: false, rememberBrowser: false);
                //member.LastLoginDate = DateTime.Now;
                DataContext.Members.Add(member);
                Group.AllMembers.Members.Add(member);
                member.ActivationCode = Guid.NewGuid().ToString();
                member.ActivationEmailSentDate = DateTime.Now;
                await DataContext.SaveChangesAsync();
                //string code = await UserManager.GenerateEmailConfirmationTokenAsync(user.Id);
                //var callbackUrl = string.Format("{0}://{1}/activate/{2}/{3}",
                //    this.Request.Url.Scheme, this.Request.Url.Authority, member.Id, member.ActivationCode);// Url.Action("ConfirmEmail", "Home", new { userId = user.Id, code = code }, protocol: Request.Url.Scheme);\
                //await UserManager.SendEmailAsync(member.EmailAddress, this.Request.Url.Scheme, this.Request.Url.Authority, member.Id, member.ActivationCode);
                MailHelper mh = new MailHelper();
                await mh.SendAccountActivationAsync(member.EmailAddress, this.Request.Url.Scheme, this.Request.Url.Authority, member.Id, member.ActivationCode);
                return Json(new { Success = true });
            }
            return Json(new { Success = false, Error = result.Errors.First() });
        }
        [AllowAnonymous]
        [Route("activate/{userId}/{code}")]
        public async Task<ActionResult> Activate(string userId, string code)
        {
            Member member = DataContext.Members.SingleOrDefault(m => m.Id == userId);
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
                member.LastLoginDate = DateTime.Now;
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
                Member member = DataContext.Members.Single(m => m.EmailAddress == model.emailAddress);
                member.PasswordResetCode = Guid.NewGuid().ToString();
                member.PasswordResetEmailSentDate = DateTime.Now;
                await DataContext.SaveChangesAsync();
                MailHelper mh = new MailHelper();
                await mh.SendPasswordResetAsync(member.EmailAddress, this.Request.Url.Scheme, this.Request.Url.Authority, member.Id, member.PasswordResetCode);
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
            Member member = DataContext.Members.SingleOrDefault(m => m.Id == userId);
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
                Member member = DataContext.Members.Single(m => m.EmailAddress == model.emailAddress);
                bool visiblePassword = SiteSetting.Get("VisiblePassword", false);
                if (visiblePassword)
                {
                    member.PlainPassword = newPassword;
                }
                await DataContext.SaveChangesAsync();
                using (ApplicationDbContext appDb = new ApplicationDbContext())
                {
                    var user = appDb.Users.Find(member.Id);
                    user.PasswordHash = Member.HashPassword(newPassword);
                    user.SecurityStamp = Guid.NewGuid().ToString();
                    await appDb.SaveChangesAsync();
                    await SignInManager.SignInAsync(user, false, false);
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
                var memberCount = DataContext.Members.Count();
                if (memberCount == 0)
                {
                    var user = new ApplicationUser { UserName = model.Email, Email = model.Email };
                    var result = await UserManager.CreateAsync(user, model.Password);
                    //var result = UserManager.CreateAsync(user, model.password).Result;
                    if (result.Succeeded)
                    {
                        bool visiblePassword = SiteSetting.Get("VisiblePassword", false);
                        Member member = new Member
                        {
                            Id = user.Id,
                            EmailAddress = model.Email,
                            EmailAddressConfirmed = true,
                            FirstName = "",
                            LastName = "Administrator",
                            IsAdministrator = true,
                            CreationDate = DateTime.Now
                        };
                        if (visiblePassword)
                        {
                            member.PlainPassword = model.Password;
                        }
                        await SignInManager.SignInAsync(user, isPersistent: false, rememberBrowser: false);
                        //SignInManager.SignInAsync(user, isPersistent: false, rememberBrowser: false);
                        member.LastLoginDate = DateTime.Now;
                        DataContext.Members.Add(member);
                        Group.AllMembers.Members.Add(member);
                        Group.Administrators.Members.Add(member);
                        Group.Designers.Members.Add(member);
                        Group.Editors.Members.Add(member);
                        Debug.Print("Saving member {0} ...", member.Id);
                        int x = await DataContext.SaveChangesAsync();
                        Debug.Print("... saved member {0}, returned {1}", member.Id, x);
                        return RedirectToAction("AdminConfirmed");
                    }
                    //return Json(new { Success = false, Error = result.Errors.First() }, JsonRequestBehavior.AllowGet);
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
                string name = string.Join(" ", member.FirstName, member.LastName).Trim();
                return Json(new { Authenticated = true, Name = name, EmailAddress = user.Email }, JsonRequestBehavior.AllowGet);
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
            ClientSideActions name = (ClientSideActions) Enum.Parse(typeof(ClientSideActions), dialogue);
            PageModel pm = GetPageModel(name);
            return Json(pm, JsonRequestBehavior.AllowGet);
        }
        [HttpGet]
        [AllowAnonymous]
        [Route("model/permitted/{dialogue}")]
        public ActionResult PageIsDialogPermittedModel(string dialogue)
        {
            bool permitted = false;
            ClientSideActions name = (ClientSideActions)Enum.Parse(typeof(ClientSideActions), dialogue);
            switch (name)
            {
                case ClientSideActions.userprofile:
                    permitted = Request.IsAuthenticated;
                    break;
                default:
                    break;
            }
            return Json(new { Permitted = permitted }, JsonRequestBehavior.AllowGet);
        }
        [HttpGet]
        [AllowAnonymous]
        [Route("account/test")]
        public ActionResult Test1()
        {
            Debugger.Break();
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
        //private PageModel GetPageModel(long? pageId)
        private PageModel GetPageModel()
        {
            string pageId = this.CurrentPageId;
            PageModel pm = new PageModel(pageId, CurrentMember);
            return pm;
        }
        //private PageModel GetPageModel(ClientDialogNames name, long? pageId)
        private PageModel GetPageModel(ClientSideActions name)
        {

            Member member = null;
            if (User.Identity.IsAuthenticated)
            {
                //var user = await UserManager.FindByEmailAsync(User.Identity.Name);
                member = DataContext.Members.Single(m => m.EmailAddress == User.Identity.Name);
            }
            PageModel pm = GetPageModel();// new PageModel(pageId);
            pm.SetClientAction(name, member);
            return pm;
        }
        //private PageModel GetPageModel(ClientDialogNames name, Member member, long? pageId)
        private PageModel GetPageModel(ClientSideActions name, Member member)
        {
            PageModel pm = GetPageModel();
            pm.SetClientAction(name, member);
            return pm;
        }
        private Member GetCurrentMember()
        {
            if (User.Identity.IsAuthenticated)
            {
                return DataContext.Members.Single(m => m.EmailAddress == User.Identity.Name);
            }
            else
            {
                return null;
            }
        }
        private void RecordCurrentMember()
        {
            Member m = GetCurrentMember();
            CurrentMemberId = m == null ? null : m.Id;
        }
    }

}
