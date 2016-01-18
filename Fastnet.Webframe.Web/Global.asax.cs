using Fastnet.EventSystem;
using Fastnet.Web.Common;
using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.Web.Common;
using System;
using System.Configuration;
using System.Diagnostics;
using System.Linq;
using System.Reflection;
using System.Web;
using System.Web.Hosting;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;
using System.Web.SessionState;
using System.Web.WebPages;


namespace Fastnet.Webframe.Web
{
    public class MvcApplication : System.Web.HttpApplication
    {
        protected void Application_Error(object sender, EventArgs e)
        {
            Exception xe = Server.GetLastError();
            Log.Write(xe);
        }
        protected void Application_PostAuthorizeRequest()
        {
            HttpContext.Current.SetSessionStateBehavior(SessionStateBehavior.Required);  
        }
        protected void Application_Start()
        {
            AppDomain.CurrentDomain.UnhandledException += CurrentDomain_UnhandledException;
            string appDataFolder = HostingEnvironment.MapPath("~/App_Data");
            if (!System.IO.Directory.Exists(appDataFolder))
            {
                System.IO.Directory.CreateDirectory(appDataFolder);
            }
            AutofacConfig.ConfigureContainer();
            dynamic version = VersionInfo.Get(typeof(MvcApplication));
            bool coreDbExists = true;
            if (new CoreDataContext().Database.Exists() == false)
            {
                // **NB**
                // Creating database schemas with migrations is not intuitive.
                // 1. I have multiple schemas in one database. This might be contributing some complication.
                //    The simple call to CreateIfNotExists tests a database not a schema (so may be that complicates matters with
                //    multiple datacontexts.
                // 2. Probing the data (as done below for the appdb and bookingdb) works but ONLY if it is before the
                //    SetInitializer call! This is counter intuitive to me!
                // 3. On a separate point, I should find a way of only probing the booking db if booking is enabled ...
                using (var appdb = new ApplicationDbContext())
                {
                    int count = appdb.Users.Count();
                    Debug.Print("ApplicationDbContext user count = {0}", count);
                }
                using (var db = new BookingDataContext())
                {
                    int count = db.Bookings.Count();
                    Debug.Print("BookingDataContext booking count = {0}", count);
                }
                coreDbExists = false;
            }
            Log.SetApplicationName(ConfigurationManager.AppSettings["SiteUrl"]);
            ApplicationDbContext.SetInitializer();
            BookingDataContext.SetInitializer();
            CoreDataContext.SetInitializer(!coreDbExists);
            RouteConfig.MapMVC(RouteTable.Routes);
            AreaRegistration.RegisterAllAreas();
            GlobalConfiguration.Configure(WebApiConfig.Register);
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            BundleConfig.RegisterBundles(BundleTable.Bundles);
            TemplateLibrary.ScanForTemplates();


            using (CoreDataContext core = new CoreDataContext())
            {
                //int count = core.Groups.Count(); // causes seeding, migrations, etc.
                ApplicationAction aa = new ApplicationAction
                {
                    SiteUrl = ConfigurationManager.AppSettings["SiteUrl"],
                    Version = version.HostAssembly.Version.ToString(),
                    Remark = string.Format("Process {0} on machine {1}", version.ProcessId, version.Machine)
                };
                core.Actions.Add(aa);
                core.ResetAllTasks();
                core.SaveChanges();
            }
            BookingData.BookingGlobals.Startup();
        }

        private void CurrentDomain_UnhandledException(object sender, UnhandledExceptionEventArgs e)
        {
            Log.Write(e.ExceptionObject as Exception);
        }

        protected void Session_Start()
        {            
            var ctx = new HttpContextWrapper(this.Context);
            string ua = ctx.GetOverriddenUserAgent();
            Session["CanTouch"] = IsIPad(ua) || IsTablet(ua);
            Session["UseApiRelay"] = IsIPad(ua);
            LogBrowser();

        }
        private void LogBrowser()
        {
            HttpBrowserCapabilities caps = this.Request.Browser;
            if (caps != null)
            {
                if (Session.IsNewSession)
                {
                    using (CoreDataContext core = new CoreDataContext())
                    {
                        SessionAction sa = new SessionAction
                        {
                            SessionId = Session.SessionID,
                            Browser = caps.Browser,
                            Version = caps.Version,
                            IpAddress = Request.UserHostAddress,
                            ScreenWidth = caps.ScreenPixelsWidth,
                            ScreenHeight = caps.ScreenPixelsHeight,
                            CanTouch = (bool)Session["CanTouch"]
                        };
                        core.Actions.Add(sa);
                        core.SaveChanges();
                    }

                }
                else
                {
                    Log.Write("Session {0} restarted", Session.SessionID);
                }
                //Log.Write("{5} is {0}, {1}, {2}, {3}, {4},{6} {7}w x {8}h", caps.Type, caps.Browser, caps.Version,
                //    Request.UserHostAddress, string.IsNullOrWhiteSpace(Request.UserAgent) ? "No user agent" : Request.UserAgent,
                //    caps.IsMobileDevice ? "Mobile browser" : "Browser",
                //    (bool)Session["CanTouch"] ? " Touch," : "", caps.ScreenPixelsWidth, caps.ScreenPixelsHeight);
            }
            else
            {
                Log.Write("Session started without browser capability available");
            }
        }
        private bool IsTablet(string userAgentString)
        {
            return userAgentString == null ? false : userAgentString.IndexOf("Touch", StringComparison.InvariantCultureIgnoreCase) >= 0 && userAgentString.IndexOf("Tablet PC", StringComparison.InvariantCultureIgnoreCase) >= 0;
        }
        private bool IsIPad(string userAgentString)
        {
            return userAgentString == null ? false : userAgentString.IndexOf("IPad", StringComparison.InvariantCultureIgnoreCase) >= 0;
        }

    }
    public class VersionInfo
    {
        public static dynamic Get(Type type)
        {
            Func<Assembly, object> assemblyInfo = (a) =>
            {
                string currentAssemblyName = a.GetName().Name;
                Version currentAssemblyVersion = a.GetName().Version;
                return new
                {
                    Name = currentAssemblyName,
                    Version = currentAssemblyVersion
                };
            };
            Assembly current = Assembly.GetAssembly(type);
            Assembly executingIn = Assembly.GetEntryAssembly();
            if (executingIn == null)
            {
                executingIn = Assembly.GetExecutingAssembly();
            }
            return new
            {
                Type = type.Name,
                HostAssembly = assemblyInfo(current),
                ExecutingAssembly = assemblyInfo(executingIn),
                ProcessId = System.Diagnostics.Process.GetCurrentProcess().Id,
                Machine = Environment.MachineName.ToLower()
                //ThreadId = System.Threading.Thread.CurrentThread.ManagedThreadId,
                //ThreadName = System.Threading.Thread.CurrentThread.Name ?? ""
            };
        }
    }
}
